import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

describe("Tests d'intégration : albums et réorganisation de tracklist (/api/albums)", () => {
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

  async function createAlbum(sessionId: string, payload: Record<string, unknown> = {}) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/albums',
      cookies: authCookie(sessionId),
      payload: { title: 'Album de test', ...payload },
    });
    if (response.statusCode !== 201) {
      throw new Error(`Création d'album échouée : ${response.statusCode}`);
    }
    return response.json();
  }

  async function createSong(sessionId: string, title: string) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/songs',
      cookies: authCookie(sessionId),
      payload: { title, content: `Paroles de ${title}` },
    });
    return response.json();
  }

  describe('POST /api/albums', () => {
    it('crée un album avec un titre, une description et une pochette', async () => {
      const { userId, sessionId } = await registerUser('albums-create@verso.fr');

      const response = await app.inject({
        method: 'POST',
        url: '/api/albums',
        cookies: authCookie(sessionId),
        payload: {
          title: 'Première Ligne',
          description: 'Projet 8 titres',
          coverImageKey: 'users/cover.jpg',
        },
      });

      expect(response.statusCode).toBe(201);
      const album = response.json();
      expect(album.title).toBe('Première Ligne');
      expect(album.description).toBe('Projet 8 titres');

      const stored = await prisma.album.findUnique({ where: { id: album.id } });
      expect(stored?.userId).toBe(userId);
    });

    it('rejette un titre manquant avec un statut 400', async () => {
      const { sessionId } = await registerUser('albums-create-bad@verso.fr');

      const response = await app.inject({
        method: 'POST',
        url: '/api/albums',
        cookies: authCookie(sessionId),
        payload: { description: 'Sans titre' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('rejette un accès sans session avec un statut 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/albums',
        payload: { title: 'Sans session' },
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/albums', () => {
    it('liste les albums de l’utilisateur avec le nombre de pistes', async () => {
      const { sessionId } = await registerUser('albums-list@verso.fr');
      const album = await createAlbum(sessionId, { title: 'Mon album' });
      const song = await createSong(sessionId, 'Piste 1');
      await app.inject({
        method: 'POST',
        url: `/api/albums/${album.id}/tracks`,
        cookies: authCookie(sessionId),
        payload: { songId: song.id },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/albums',
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(200);
      const items = response.json();
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Mon album');
      expect(items[0].tracksCount).toBe(1);
    });

    it('ne renvoie pas les albums d’un autre utilisateur (cloisonnement)', async () => {
      const owner = await registerUser('albums-owner@verso.fr');
      const intruder = await registerUser('albums-intruder@verso.fr');
      await createAlbum(owner.sessionId, { title: 'Privé' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/albums',
        cookies: authCookie(intruder.sessionId),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });
  });

  describe('GET /api/albums/:id', () => {
    it('retourne l’album avec sa tracklist ordonnée', async () => {
      const { sessionId } = await registerUser('albums-detail@verso.fr');
      const album = await createAlbum(sessionId, { title: 'Ordonné' });
      const first = await createSong(sessionId, 'Première');
      const second = await createSong(sessionId, 'Seconde');
      for (const song of [first, second]) {
        await app.inject({
          method: 'POST',
          url: `/api/albums/${album.id}/tracks`,
          cookies: authCookie(sessionId),
          payload: { songId: song.id },
        });
      }

      const response = await app.inject({
        method: 'GET',
        url: `/api/albums/${album.id}`,
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(200);
      const detail = response.json();
      expect(detail.tracks.map((t: { title: string }) => t.title)).toEqual([
        'Première',
        'Seconde',
      ]);
      expect(detail.tracks.map((t: { position: number }) => t.position)).toEqual([1, 2]);
    });

    it('renvoie 404 pour l’album d’un autre utilisateur', async () => {
      const owner = await registerUser('albums-detail-owner@verso.fr');
      const intruder = await registerUser('albums-detail-intruder@verso.fr');
      const album = await createAlbum(owner.sessionId, { title: 'Secret' });

      const response = await app.inject({
        method: 'GET',
        url: `/api/albums/${album.id}`,
        cookies: authCookie(intruder.sessionId),
      });

      expect(response.statusCode).toBe(404);
    });

    it('rejette un identifiant non UUID avec un statut 400', async () => {
      const { sessionId } = await registerUser('albums-bad-id@verso.fr');
      const response = await app.inject({
        method: 'GET',
        url: '/api/albums/pas-un-uuid',
        cookies: authCookie(sessionId),
      });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /api/albums/:id', () => {
    it('met à jour les métadonnées de l’album', async () => {
      const { sessionId } = await registerUser('albums-update@verso.fr');
      const album = await createAlbum(sessionId, { title: 'Avant' });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/albums/${album.id}`,
        cookies: authCookie(sessionId),
        payload: { title: 'Après', description: 'Nouvelle description' },
      });

      expect(response.statusCode).toBe(200);
      const updated = response.json();
      expect(updated.title).toBe('Après');
      expect(updated.description).toBe('Nouvelle description');
    });

    it('renvoie 404 pour l’album d’un autre utilisateur', async () => {
      const owner = await registerUser('albums-update-owner@verso.fr');
      const intruder = await registerUser('albums-update-intruder@verso.fr');
      const album = await createAlbum(owner.sessionId, { title: 'Intouchable' });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/albums/${album.id}`,
        cookies: authCookie(intruder.sessionId),
        payload: { title: 'Piraté' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/albums/:id/tracks', () => {
    it('rattache un texte existant et lui attribue la dernière position', async () => {
      const { sessionId } = await registerUser('albums-add-track@verso.fr');
      const album = await createAlbum(sessionId, { title: 'Tracklist' });
      const song = await createSong(sessionId, 'À rattacher');

      const response = await app.inject({
        method: 'POST',
        url: `/api/albums/${album.id}/tracks`,
        cookies: authCookie(sessionId),
        payload: { songId: song.id },
      });

      expect(response.statusCode).toBe(201);
      const stored = await prisma.song.findUnique({ where: { id: song.id } });
      expect(stored?.albumId).toBe(album.id);
      expect(stored?.positionInAlbum).toBe(1);
    });

    it('refuse un texte appartenant à un autre utilisateur', async () => {
      const owner = await registerUser('albums-track-owner@verso.fr');
      const intruder = await registerUser('albums-track-intruder@verso.fr');
      const album = await createAlbum(owner.sessionId, { title: 'Cible' });
      const foreignSong = await createSong(intruder.sessionId, 'Étranger');

      const response = await app.inject({
        method: 'POST',
        url: `/api/albums/${album.id}/tracks`,
        cookies: authCookie(owner.sessionId),
        payload: { songId: foreignSong.id },
      });

      expect(response.statusCode).toBe(404);
      const stored = await prisma.song.findUnique({ where: { id: foreignSong.id } });
      expect(stored?.albumId).toBeNull();
    });
  });

  describe('PUT /api/albums/:id/tracks/reorder', () => {
    it('persiste le nouvel ordre des pistes', async () => {
      const { sessionId } = await registerUser('albums-reorder@verso.fr');
      const album = await createAlbum(sessionId, { title: 'À réordonner' });
      const songs = [];
      for (const title of ['Un', 'Deux', 'Trois']) {
        const song = await createSong(sessionId, title);
        songs.push(song);
        await app.inject({
          method: 'POST',
          url: `/api/albums/${album.id}/tracks`,
          cookies: authCookie(sessionId),
          payload: { songId: song.id },
        });
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/albums/${album.id}/tracks/reorder`,
        cookies: authCookie(sessionId),
        payload: { songIds: [songs[2].id, songs[0].id, songs[1].id] },
      });

      expect(response.statusCode).toBe(200);

      const detail = await app.inject({
        method: 'GET',
        url: `/api/albums/${album.id}`,
        cookies: authCookie(sessionId),
      });
      expect(detail.json().tracks.map((t: { title: string }) => t.title)).toEqual([
        'Trois',
        'Un',
        'Deux',
      ]);
      expect(detail.json().tracks.map((t: { position: number }) => t.position)).toEqual([1, 2, 3]);
    });

    it('rejette une liste contenant un texte hors de l’album avec un statut 400', async () => {
      const { sessionId } = await registerUser('albums-reorder-bad@verso.fr');
      const album = await createAlbum(sessionId, { title: 'Strict' });
      const inside = await createSong(sessionId, 'Dedans');
      const outside = await createSong(sessionId, 'Dehors');
      await app.inject({
        method: 'POST',
        url: `/api/albums/${album.id}/tracks`,
        cookies: authCookie(sessionId),
        payload: { songId: inside.id },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/albums/${album.id}/tracks/reorder`,
        cookies: authCookie(sessionId),
        payload: { songIds: [inside.id, outside.id] },
      });

      expect(response.statusCode).toBe(400);
    });

    it('rejette une liste avec doublons avec un statut 400', async () => {
      const { sessionId } = await registerUser('albums-reorder-dup@verso.fr');
      const album = await createAlbum(sessionId, { title: 'Doublons' });
      const song = await createSong(sessionId, 'Unique');
      await app.inject({
        method: 'POST',
        url: `/api/albums/${album.id}/tracks`,
        cookies: authCookie(sessionId),
        payload: { songId: song.id },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/albums/${album.id}/tracks/reorder`,
        cookies: authCookie(sessionId),
        payload: { songIds: [song.id, song.id] },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/albums/:id/tracks/:songId', () => {
    it('détache le texte sans le supprimer et réajuste les positions', async () => {
      const { sessionId } = await registerUser('albums-remove-track@verso.fr');
      const album = await createAlbum(sessionId, { title: 'Détachement' });
      const songs = [];
      for (const title of ['Un', 'Deux', 'Trois']) {
        const song = await createSong(sessionId, title);
        songs.push(song);
        await app.inject({
          method: 'POST',
          url: `/api/albums/${album.id}/tracks`,
          cookies: authCookie(sessionId),
          payload: { songId: song.id },
        });
      }

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/albums/${album.id}/tracks/${songs[0].id}`,
        cookies: authCookie(sessionId),
      });
      expect(response.statusCode).toBe(204);

      const detached = await prisma.song.findUnique({ where: { id: songs[0].id } });
      expect(detached).not.toBeNull();
      expect(detached?.albumId).toBeNull();
      expect(detached?.positionInAlbum).toBeNull();

      const detail = await app.inject({
        method: 'GET',
        url: `/api/albums/${album.id}`,
        cookies: authCookie(sessionId),
      });
      expect(detail.json().tracks.map((t: { title: string }) => t.title)).toEqual([
        'Deux',
        'Trois',
      ]);
      expect(detail.json().tracks.map((t: { position: number }) => t.position)).toEqual([1, 2]);
    });
  });

  describe('DELETE /api/albums/:id', () => {
    it('supprime l’album en détachant les textes sans jamais les supprimer', async () => {
      const { sessionId } = await registerUser('albums-delete@verso.fr');
      const album = await createAlbum(sessionId, { title: 'Éphémère' });
      const songs = [];
      for (const title of ['Un', 'Deux', 'Trois']) {
        const song = await createSong(sessionId, title);
        songs.push(song);
        await app.inject({
          method: 'POST',
          url: `/api/albums/${album.id}/tracks`,
          cookies: authCookie(sessionId),
          payload: { songId: song.id },
        });
      }

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/albums/${album.id}`,
        cookies: authCookie(sessionId),
      });
      expect(response.statusCode).toBe(204);

      expect(await prisma.album.count()).toBe(0);
      // Règle constitutionnelle : aucun texte ne doit être supprimé.
      expect(await prisma.song.count()).toBe(3);

      for (const song of songs) {
        const stored = await prisma.song.findUnique({ where: { id: song.id } });
        expect(stored).not.toBeNull();
        expect(stored?.albumId).toBeNull();
        expect(stored?.positionInAlbum).toBeNull();
      }
    });

    it('renvoie 404 pour l’album d’un autre utilisateur', async () => {
      const owner = await registerUser('albums-delete-owner@verso.fr');
      const intruder = await registerUser('albums-delete-intruder@verso.fr');
      const album = await createAlbum(owner.sessionId, { title: 'Protégé' });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/albums/${album.id}`,
        cookies: authCookie(intruder.sessionId),
      });

      expect(response.statusCode).toBe(404);
      expect(await prisma.album.count()).toBe(1);
    });
  });
});
