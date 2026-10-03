import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

describe("Tests d'intégration : historique des versions (/api/songs/:id/versions)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.songTag.deleteMany();
    await prisma.songVersion.deleteMany();
    await prisma.shareLink.deleteMany();
    await prisma.voiceNote.deleteMany();
    await prisma.instrumental.deleteMany();
    await prisma.song.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.album.deleteMany();
    await prisma.session.deleteMany();
    await prisma.emailToken.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  });

  async function registerUser(email: string): Promise<{ sessionId: string }> {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'Password123!' },
    });
    const sessionId = response.cookies.find((c) => c.name === 'session_id')?.value;
    if (!sessionId) {
      throw new Error("Échec de l'obtention du cookie de session");
    }
    return { sessionId };
  }

  function authCookie(sessionId: string): { session_id: string } {
    return { session_id: sessionId };
  }

  async function createSong(sessionId: string, title: string, content: string) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/songs',
      cookies: authCookie(sessionId),
      payload: { title, content },
    });
    return response.json();
  }

  async function updateSong(
    sessionId: string,
    songId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await app.inject({
      method: 'PATCH',
      url: `/api/songs/${songId}`,
      cookies: authCookie(sessionId),
      payload,
    });
  }

  describe('Archivage des versions', () => {
    it('archive automatiquement la version précédente lors du premier enregistrement', async () => {
      const { sessionId } = await registerUser('versions-auto@verso.fr');
      const song = await createSong(sessionId, 'Brouillon', 'premier jet');

      await updateSong(sessionId, song.id, { content: 'deuxième jet' });

      const stored = await prisma.songVersion.findMany({ where: { songId: song.id } });
      expect(stored).toHaveLength(1);
      expect(stored[0].content).toBe('premier jet');
    });

    it('force un instantané immuable quand createVersion est vrai', async () => {
      const { sessionId } = await registerUser('versions-force@verso.fr');
      const song = await createSong(sessionId, 'Versionné', 'v1');

      await updateSong(sessionId, song.id, { content: 'v2', createVersion: true });
      await updateSong(sessionId, song.id, { content: 'v3', createVersion: true });

      const versions = await prisma.songVersion.findMany({
        where: { songId: song.id },
        orderBy: { createdAt: 'asc' },
      });
      expect(versions).toHaveLength(2);
      expect(versions.map((v) => v.content)).toEqual(['v1', 'v2']);
    });

    it('conserve intégralement toutes les versions sans purge ni plafond', async () => {
      const { sessionId } = await registerUser('versions-no-purge@verso.fr');
      const song = await createSong(sessionId, 'Long', 'contenu 0');

      for (let index = 1; index <= 15; index += 1) {
        await updateSong(sessionId, song.id, {
          content: `contenu ${index}`,
          createVersion: true,
        });
      }

      // 15 mises à jour forcées archivent chacune l'état précédent, sans purge.
      const count = await prisma.songVersion.count({ where: { songId: song.id } });
      expect(count).toBe(15);
    });
  });

  describe('GET /api/songs/:id/versions', () => {
    it('retourne les versions de la plus récente à la plus ancienne', async () => {
      const { sessionId } = await registerUser('versions-list@verso.fr');
      const song = await createSong(sessionId, 'Liste', 'v1');
      await updateSong(sessionId, song.id, { content: 'v2', createVersion: true });
      await updateSong(sessionId, song.id, { content: 'v3', createVersion: true });

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/versions`,
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(200);
      const versions = response.json();
      expect(versions.map((v: { content: string }) => v.content)).toEqual(['v2', 'v1']);
      expect(versions[0]).toHaveProperty('title');
      expect(versions[0]).toHaveProperty('createdAt');
    });

    it('renvoie 404 pour le texte d’un autre utilisateur (cloisonnement)', async () => {
      const owner = await registerUser('versions-owner@verso.fr');
      const intruder = await registerUser('versions-intruder@verso.fr');
      const song = await createSong(owner.sessionId, 'Privé', 'secret');

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/versions`,
        cookies: authCookie(intruder.sessionId),
      });

      expect(response.statusCode).toBe(404);
    });

    it('rejette un identifiant non UUID avec un statut 400', async () => {
      const { sessionId } = await registerUser('versions-bad-id@verso.fr');
      const response = await app.inject({
        method: 'GET',
        url: '/api/songs/pas-un-uuid/versions',
        cookies: authCookie(sessionId),
      });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/songs/:id/versions/:versionId/restore', () => {
    it('restaure une version antérieure sans écraser l’historique', async () => {
      const { sessionId } = await registerUser('versions-restore@verso.fr');
      const song = await createSong(sessionId, 'À restaurer', 'état initial');
      await updateSong(sessionId, song.id, { content: 'état modifié', createVersion: true });

      const versions = await prisma.songVersion.findMany({ where: { songId: song.id } });
      const target = versions.find((v) => v.content === 'état initial');
      expect(target).toBeDefined();

      const response = await app.inject({
        method: 'POST',
        url: `/api/songs/${song.id}/versions/${target!.id}/restore`,
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(200);
      const restored = response.json();
      expect(restored.content).toBe('état initial');

      const stored = await prisma.song.findUnique({ where: { id: song.id } });
      expect(stored?.content).toBe('état initial');

      // Zéro perte : l'état précédent est archivé avant la restauration.
      const after = await prisma.songVersion.count({ where: { songId: song.id } });
      expect(after).toBe(2);
      const archived = await prisma.songVersion.findFirst({
        where: { songId: song.id, content: 'état modifié' },
      });
      expect(archived).not.toBeNull();
    });

    it('renvoie 404 pour une version d’un autre texte', async () => {
      const { sessionId } = await registerUser('versions-cross@verso.fr');
      const first = await createSong(sessionId, 'Premier', 'v1');
      await updateSong(sessionId, first.id, { content: 'v2', createVersion: true });
      const second = await createSong(sessionId, 'Second', 'autre');

      const versions = await prisma.songVersion.findMany({ where: { songId: first.id } });
      const foreignVersion = versions[0];

      const response = await app.inject({
        method: 'POST',
        url: `/api/songs/${second.id}/versions/${foreignVersion.id}/restore`,
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(404);
    });

    it('renvoie 404 pour le texte d’un autre utilisateur', async () => {
      const owner = await registerUser('versions-restore-owner@verso.fr');
      const intruder = await registerUser('versions-restore-intruder@verso.fr');
      const song = await createSong(owner.sessionId, 'Protégé', 'v1');
      await updateSong(owner.sessionId, song.id, { content: 'v2', createVersion: true });
      const version = await prisma.songVersion.findFirst({ where: { songId: song.id } });

      const response = await app.inject({
        method: 'POST',
        url: `/api/songs/${song.id}/versions/${version!.id}/restore`,
        cookies: authCookie(intruder.sessionId),
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
