import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

describe("Tests d'intégration : CRUD des textes (/api/songs)", () => {
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

  async function registerUser(email: string): Promise<{ userId: string; sessionId: string }> {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'Password123!' },
    });
    const sessionId = response.cookies.find((c) => c.name === 'session_id')?.value;
    if (!sessionId) {
      throw new Error("Échec de l'obtention du cookie de session");
    }
    return { userId: response.json().user.id as string, sessionId };
  }

  function authCookie(sessionId: string): { session_id: string } {
    return { session_id: sessionId };
  }

  describe('POST /api/songs', () => {
    it('crée un texte brouillon avec un titre par défaut', async () => {
      const { userId, sessionId } = await registerUser('songs-create@verso.fr');

      const response = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(sessionId),
        payload: {},
      });

      expect(response.statusCode).toBe(201);
      const item = response.json();
      expect(item.title).toBe('Sans titre');
      expect(item.status).toBe('DRAFT');
      expect(item.isFavorite).toBe(false);
      expect(item.tags).toEqual([]);

      const stored = await prisma.song.findUnique({ where: { id: item.id } });
      expect(stored?.userId).toBe(userId);
    });

    it('crée un texte avec titre, contenu et tags', async () => {
      const { sessionId } = await registerUser('songs-create-full@verso.fr');

      const response = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(sessionId),
        payload: {
          title: 'Nuit blanche',
          content: 'les néons clignotent sur le bitume',
          tags: ['Colère', 'Freestyle'],
        },
      });

      expect(response.statusCode).toBe(201);
      const item = response.json();
      expect(item.title).toBe('Nuit blanche');
      expect(item.excerpt).toContain('néons');
      expect(item.tags.sort()).toEqual(['Colère', 'Freestyle']);
    });

    it('rejette un titre invalide avec un statut 400', async () => {
      const { sessionId } = await registerUser('songs-create-bad@verso.fr');

      const response = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(sessionId),
        payload: { title: '' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('rejette un accès sans session avec un statut 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/songs',
        payload: { title: 'Sans session' },
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/songs/:id', () => {
    it('retourne le texte demandé', async () => {
      const { sessionId } = await registerUser('songs-get@verso.fr');
      const created = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(sessionId),
        payload: { title: 'Rimes croisées', content: 'abab' },
      });
      const songId = created.json().id as string;

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}`,
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().title).toBe('Rimes croisées');
    });

    it('renvoie 404 pour le texte d’un autre utilisateur (cloisonnement)', async () => {
      const owner = await registerUser('owner-get@verso.fr');
      const intruder = await registerUser('intruder-get@verso.fr');
      const created = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Privé' },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${created.json().id}`,
        cookies: authCookie(intruder.sessionId),
      });

      expect(response.statusCode).toBe(404);
    });

    it('rejette un identifiant non UUID avec un statut 400', async () => {
      const { sessionId } = await registerUser('songs-bad-id@verso.fr');
      const response = await app.inject({
        method: 'GET',
        url: '/api/songs/pas-un-uuid',
        cookies: authCookie(sessionId),
      });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/songs/:id', () => {
    it('enregistre le contenu de façon répétée (sauvegarde automatique)', async () => {
      const { sessionId } = await registerUser('songs-autosave@verso.fr');
      const created = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(sessionId),
        payload: { title: 'Autosave' },
      });
      const songId = created.json().id as string;

      const first = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${songId}`,
        cookies: authCookie(sessionId),
        payload: { content: 'premier couplet' },
      });
      expect(first.statusCode).toBe(200);

      const second = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${songId}`,
        cookies: authCookie(sessionId),
        payload: { content: 'premier couplet\nsecond couplet' },
      });
      expect(second.statusCode).toBe(200);
      expect(second.json().excerpt).toContain('second couplet');

      const stored = await prisma.song.findUnique({ where: { id: songId } });
      expect(stored?.content).toBe('premier couplet\nsecond couplet');
    });

    it('met à jour le statut, le favori et remplace les tags', async () => {
      const { sessionId } = await registerUser('songs-update@verso.fr');
      const created = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(sessionId),
        payload: { title: 'Métadonnées', tags: ['Ancien'] },
      });
      const songId = created.json().id as string;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${songId}`,
        cookies: authCookie(sessionId),
        payload: { status: 'COMPLETED', isFavorite: true, tags: ['Nouveau', 'Final'] },
      });

      expect(response.statusCode).toBe(200);
      const item = response.json();
      expect(item.status).toBe('COMPLETED');
      expect(item.isFavorite).toBe(true);
      expect(item.tags.sort()).toEqual(['Final', 'Nouveau']);
    });

    it('rejette un corps vide et un statut invalide avec un statut 400', async () => {
      const { sessionId } = await registerUser('songs-update-bad@verso.fr');
      const created = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(sessionId),
        payload: { title: 'Validation' },
      });
      const songId = created.json().id as string;

      const empty = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${songId}`,
        cookies: authCookie(sessionId),
        payload: {},
      });
      expect(empty.statusCode).toBe(400);

      const badStatus = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${songId}`,
        cookies: authCookie(sessionId),
        payload: { status: 'PENDING' },
      });
      expect(badStatus.statusCode).toBe(400);
    });

    it('renvoie 404 pour le texte d’un autre utilisateur', async () => {
      const owner = await registerUser('owner-update@verso.fr');
      const intruder = await registerUser('intruder-update@verso.fr');
      const created = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Intouchable' },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${created.json().id}`,
        cookies: authCookie(intruder.sessionId),
        payload: { content: 'piraté' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/songs/:id', () => {
    it('supprime le texte de l’utilisateur', async () => {
      const { sessionId } = await registerUser('songs-delete@verso.fr');
      const created = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(sessionId),
        payload: { title: 'À supprimer' },
      });
      const songId = created.json().id as string;

      const deleted = await app.inject({
        method: 'DELETE',
        url: `/api/songs/${songId}`,
        cookies: authCookie(sessionId),
      });
      expect(deleted.statusCode).toBe(204);

      const after = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}`,
        cookies: authCookie(sessionId),
      });
      expect(after.statusCode).toBe(404);
    });

    it('renvoie 404 pour le texte d’un autre utilisateur', async () => {
      const owner = await registerUser('owner-delete@verso.fr');
      const intruder = await registerUser('intruder-delete@verso.fr');
      const created = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Protégé' },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/songs/${created.json().id}`,
        cookies: authCookie(intruder.sessionId),
      });

      expect(response.statusCode).toBe(404);
      expect(await prisma.song.count()).toBe(1);
    });
  });
});
