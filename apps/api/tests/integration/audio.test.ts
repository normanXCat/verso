import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

const MAX_AUDIO_SIZE_BYTES = 75 * 1024 * 1024;

describe("Tests d'intégration : instrumentales audio (/api/songs/:id/instrumentals)", () => {
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

  async function createSong(sessionId: string, title = 'Texte audio') {
    const response = await app.inject({
      method: 'POST',
      url: '/api/songs',
      cookies: authCookie(sessionId),
      payload: { title, content: 'Paroles' },
    });
    return response.json();
  }

  async function requestUploadUrl(sessionId: string, songId: string, payload = {}) {
    return app.inject({
      method: 'POST',
      url: `/api/songs/${songId}/instrumentals/upload-url`,
      cookies: authCookie(sessionId),
      payload: {
        filename: 'instru.wav',
        mimeType: 'audio/wav',
        sizeBytes: 4_000_000,
        ...payload,
      },
    });
  }

  async function confirmInstrumental(sessionId: string, songId: string, payload = {}) {
    return app.inject({
      method: 'POST',
      url: `/api/songs/${songId}/instrumentals/confirm`,
      cookies: authCookie(sessionId),
      payload: {
        s3Key: `users/u/songs/${songId}/piste.wav`,
        title: 'Prod principale',
        mimeType: 'audio/wav',
        sizeBytes: 4_000_000,
        durationSeconds: 214.5,
        bpm: 90,
        musicalKey: 'Dm',
        ...payload,
      },
    });
  }

  describe('POST /api/songs/:id/instrumentals/upload-url', () => {
    it('génère une URL présignée PUT avec une clé cloisonnée', async () => {
      const { userId, sessionId } = await registerUser('audio-url@verso.fr');
      const song = await createSong(sessionId);

      const response = await requestUploadUrl(sessionId, song.id);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.uploadUrl).toContain('X-Amz-Signature');
      expect(body.s3Key).toMatch(new RegExp(`^users/${userId}/songs/${song.id}/.+\\.wav$`));
      expect(body.expiresInSeconds).toBe(300);

      // Aucune instrumentale n'est créée avant confirmation.
      expect(await prisma.instrumental.count()).toBe(0);
    });

    it('rejette un format audio non supporté avec un statut 400', async () => {
      const { sessionId } = await registerUser('audio-url-format@verso.fr');
      const song = await createSong(sessionId);

      const response = await requestUploadUrl(sessionId, song.id, { mimeType: 'audio/ogg' });

      expect(response.statusCode).toBe(400);
    });

    it('rejette un fichier dépassant 75 Mo avec un statut 400', async () => {
      const { sessionId } = await registerUser('audio-url-size@verso.fr');
      const song = await createSong(sessionId);

      const response = await requestUploadUrl(sessionId, song.id, {
        sizeBytes: MAX_AUDIO_SIZE_BYTES + 1,
      });

      expect(response.statusCode).toBe(400);
    });

    it('renvoie 404 pour le texte d’un autre utilisateur (cloisonnement)', async () => {
      const owner = await registerUser('audio-url-owner@verso.fr');
      const intruder = await registerUser('audio-url-intruder@verso.fr');
      const song = await createSong(owner.sessionId);

      const response = await requestUploadUrl(intruder.sessionId, song.id);

      expect(response.statusCode).toBe(404);
    });

    it('rejette un accès sans session avec un statut 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/songs/00000000-0000-0000-0000-000000000000/instrumentals/upload-url',
        payload: { filename: 'x.wav', mimeType: 'audio/wav', sizeBytes: 1000 },
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/songs/:id/instrumentals/confirm', () => {
    it('enregistre une instrumentale active avec ses métadonnées', async () => {
      const { sessionId } = await registerUser('audio-confirm@verso.fr');
      const song = await createSong(sessionId);

      const response = await confirmInstrumental(sessionId, song.id);

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.title).toBe('Prod principale');
      expect(body.isActive).toBe(true);
      expect(body.bpm).toBe(90);
      expect(body.downloadUrl).toBeTruthy();

      const stored = await prisma.instrumental.findUnique({ where: { id: body.id } });
      expect(stored?.songId).toBe(song.id);
    });

    it('désactive automatiquement la piste précédemment active', async () => {
      const { sessionId } = await registerUser('audio-confirm-active@verso.fr');
      const song = await createSong(sessionId);
      const first = (await confirmInstrumental(sessionId, song.id, { title: 'Piste A' })).json();

      const second = (await confirmInstrumental(sessionId, song.id, { title: 'Piste B' })).json();

      expect(second.isActive).toBe(true);
      const firstStored = await prisma.instrumental.findUnique({ where: { id: first.id } });
      expect(firstStored?.isActive).toBe(false);
    });

    it('refuse une quatrième instrumentale avec un statut 409', async () => {
      const { sessionId } = await registerUser('audio-quota@verso.fr');
      const song = await createSong(sessionId);
      for (let i = 0; i < 3; i += 1) {
        const response = await confirmInstrumental(sessionId, song.id, { title: `Piste ${i}` });
        expect(response.statusCode).toBe(201);
      }

      const response = await confirmInstrumental(sessionId, song.id, { title: 'Piste 4' });
      expect(response.statusCode).toBe(409);
      expect(await prisma.instrumental.count()).toBe(3);
    });

    it('renvoie 404 pour le texte d’un autre utilisateur', async () => {
      const owner = await registerUser('audio-confirm-owner@verso.fr');
      const intruder = await registerUser('audio-confirm-intruder@verso.fr');
      const song = await createSong(owner.sessionId);

      const response = await confirmInstrumental(intruder.sessionId, song.id);
      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/songs/:id/instrumentals', () => {
    it('liste les instrumentales du texte avec une URL de lecture signée', async () => {
      const { sessionId } = await registerUser('audio-list@verso.fr');
      const song = await createSong(sessionId);
      await confirmInstrumental(sessionId, song.id, { title: 'Unique' });

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/instrumentals`,
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(200);
      const items = response.json();
      expect(items).toHaveLength(1);
      expect(items[0].downloadUrl).toContain('X-Amz-Signature');
    });

    it('ne renvoie pas les instrumentales d’un autre utilisateur', async () => {
      const owner = await registerUser('audio-list-owner@verso.fr');
      const intruder = await registerUser('audio-list-intruder@verso.fr');
      const song = await createSong(owner.sessionId);
      await confirmInstrumental(owner.sessionId, song.id);

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/instrumentals`,
        cookies: authCookie(intruder.sessionId),
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/instrumentals/:id', () => {
    it('met à jour les métadonnées et bascule la piste active', async () => {
      const { sessionId } = await registerUser('audio-patch@verso.fr');
      const song = await createSong(sessionId);
      const first = (await confirmInstrumental(sessionId, song.id, { title: 'A' })).json();
      const second = (await confirmInstrumental(sessionId, song.id, { title: 'B' })).json();

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/instrumentals/${first.id}`,
        cookies: authCookie(sessionId),
        payload: { title: 'A rééditée', bpm: 95, isActive: true },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.title).toBe('A rééditée');
      expect(body.bpm).toBe(95);
      expect(body.isActive).toBe(true);

      const secondStored = await prisma.instrumental.findUnique({ where: { id: second.id } });
      expect(secondStored?.isActive).toBe(false);
    });

    it('renvoie 404 pour l’instrumentale d’un autre utilisateur', async () => {
      const owner = await registerUser('audio-patch-owner@verso.fr');
      const intruder = await registerUser('audio-patch-intruder@verso.fr');
      const song = await createSong(owner.sessionId);
      const instrumental = (await confirmInstrumental(owner.sessionId, song.id)).json();

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/instrumentals/${instrumental.id}`,
        cookies: authCookie(intruder.sessionId),
        payload: { title: 'Piraté' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/instrumentals/:id', () => {
    it('supprime l’instrumentale en base', async () => {
      const { sessionId } = await registerUser('audio-delete@verso.fr');
      const song = await createSong(sessionId);
      const instrumental = (await confirmInstrumental(sessionId, song.id)).json();

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/instrumentals/${instrumental.id}`,
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(204);
      expect(await prisma.instrumental.findUnique({ where: { id: instrumental.id } })).toBeNull();
    });

    it('renvoie 404 pour l’instrumentale d’un autre utilisateur', async () => {
      const owner = await registerUser('audio-delete-owner@verso.fr');
      const intruder = await registerUser('audio-delete-intruder@verso.fr');
      const song = await createSong(owner.sessionId);
      const instrumental = (await confirmInstrumental(owner.sessionId, song.id)).json();

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/instrumentals/${instrumental.id}`,
        cookies: authCookie(intruder.sessionId),
      });

      expect(response.statusCode).toBe(404);
      expect(await prisma.instrumental.count()).toBe(1);
    });
  });
});
