import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

describe("Tests d'intégration : mémos vocaux (/api/songs/:id/voice-notes)", () => {
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

  async function createSong(sessionId: string, title: string) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/songs',
      cookies: authCookie(sessionId),
      payload: { title, content: 'freestyle' },
    });
    return response.json();
  }

  async function requestUploadUrl(
    sessionId: string,
    songId: string,
    payload: Record<string, unknown> = { mimeType: 'audio/webm' },
  ) {
    return app.inject({
      method: 'POST',
      url: `/api/songs/${songId}/voice-notes/upload-url`,
      cookies: authCookie(sessionId),
      payload,
    });
  }

  describe('POST /api/songs/:id/voice-notes/upload-url', () => {
    it('génère une URL présignée avec une clé dédiée aux mémos vocaux', async () => {
      const { sessionId } = await registerUser('voice-url@verso.fr');
      const song = await createSong(sessionId, 'Freestyle 1');

      const response = await requestUploadUrl(sessionId, song.id);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(typeof body.uploadUrl).toBe('string');
      expect(body.s3Key).toContain(`/songs/${song.id}/voice/`);
      expect(body.s3Key).toMatch(/\.webm$/);
      expect(body.expiresInSeconds).toBe(300);
    });

    it('rejette un format non supporté avec un statut 400', async () => {
      const { sessionId } = await registerUser('voice-bad-mime@verso.fr');
      const song = await createSong(sessionId, 'Format');

      const response = await requestUploadUrl(sessionId, song.id, { mimeType: 'audio/wav' });
      expect(response.statusCode).toBe(400);
    });

    it('renvoie 404 pour le texte d’un autre utilisateur (cloisonnement)', async () => {
      const owner = await registerUser('voice-owner@verso.fr');
      const intruder = await registerUser('voice-intruder@verso.fr');
      const song = await createSong(owner.sessionId, 'Privé');

      const response = await requestUploadUrl(intruder.sessionId, song.id);
      expect(response.statusCode).toBe(404);
    });
  });

  describe('Cycle de vie d’un mémo vocal', () => {
    it('confirme, liste puis supprime un mémo vocal', async () => {
      const { sessionId } = await registerUser('voice-cycle@verso.fr');
      const song = await createSong(sessionId, 'Cycle');
      const upload = await requestUploadUrl(sessionId, song.id);
      const { s3Key } = upload.json();

      const confirm = await app.inject({
        method: 'POST',
        url: `/api/songs/${song.id}/voice-notes/confirm`,
        cookies: authCookie(sessionId),
        payload: { s3Key, durationSeconds: 12.5 },
      });
      expect(confirm.statusCode).toBe(201);
      const created = confirm.json();
      expect(created.durationSeconds).toBe(12.5);
      expect(created.songId).toBe(song.id);
      expect(typeof created.downloadUrl).toBe('string');

      const list = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/voice-notes`,
        cookies: authCookie(sessionId),
      });
      expect(list.statusCode).toBe(200);
      expect(list.json()).toHaveLength(1);

      const remove = await app.inject({
        method: 'DELETE',
        url: `/api/voice-notes/${created.id}`,
        cookies: authCookie(sessionId),
      });
      expect(remove.statusCode).toBe(204);

      const after = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/voice-notes`,
        cookies: authCookie(sessionId),
      });
      expect(after.json()).toHaveLength(0);
    });

    it('rejette la confirmation sans clé de stockage', async () => {
      const { sessionId } = await registerUser('voice-bad-confirm@verso.fr');
      const song = await createSong(sessionId, 'Sans clé');

      const response = await app.inject({
        method: 'POST',
        url: `/api/songs/${song.id}/voice-notes/confirm`,
        cookies: authCookie(sessionId),
        payload: { durationSeconds: 5 },
      });
      expect(response.statusCode).toBe(400);
    });

    it('renvoie 404 pour la suppression d’un mémo d’un autre utilisateur', async () => {
      const owner = await registerUser('voice-del-owner@verso.fr');
      const intruder = await registerUser('voice-del-intruder@verso.fr');
      const song = await createSong(owner.sessionId, 'Protégé');
      const upload = await requestUploadUrl(owner.sessionId, song.id);
      const confirm = await app.inject({
        method: 'POST',
        url: `/api/songs/${song.id}/voice-notes/confirm`,
        cookies: authCookie(owner.sessionId),
        payload: { s3Key: upload.json().s3Key, durationSeconds: 8 },
      });
      const voiceNoteId = confirm.json().id;

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/voice-notes/${voiceNoteId}`,
        cookies: authCookie(intruder.sessionId),
      });
      expect(response.statusCode).toBe(404);
    });

    it('exige une session authentifiée', async () => {
      const { sessionId } = await registerUser('voice-noauth@verso.fr');
      const song = await createSong(sessionId, 'Anonyme');

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/voice-notes`,
      });
      expect(response.statusCode).toBe(401);
    });
  });
});
