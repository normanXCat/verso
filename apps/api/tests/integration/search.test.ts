import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

interface SeededSongOptions {
  userId: string;
  title: string;
  content: string;
  status?: 'DRAFT' | 'COMPLETED';
  isFavorite?: boolean;
  albumTitle?: string;
  tags?: string[];
}

describe("Tests d'intégration : Recherche et filtres de l'espace personnel (/api/songs)", () => {
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

  async function seedSong(options: SeededSongOptions): Promise<string> {
    const album = options.albumTitle
      ? await prisma.album.create({ data: { userId: options.userId, title: options.albumTitle } })
      : null;

    const song = await prisma.song.create({
      data: {
        userId: options.userId,
        title: options.title,
        content: options.content,
        status: options.status ?? 'DRAFT',
        isFavorite: options.isFavorite ?? false,
        albumId: album?.id ?? null,
      },
    });

    for (const name of options.tags ?? []) {
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId: options.userId, name } },
        create: { userId: options.userId, name },
        update: {},
      });
      await prisma.songTag.create({ data: { songId: song.id, tagId: tag.id } });
    }

    return song.id;
  }

  function search(query: string, sessionId: string): ReturnType<FastifyInstance['inject']> {
    return app.inject({
      method: 'GET',
      url: `/api/songs?${query}`,
      cookies: { session_id: sessionId },
    });
  }

  describe('Recherche plein texte', () => {
    it('renvoie uniquement les textes de l’utilisateur authentifié (cloisonnement)', async () => {
      const owner = await registerUser('owner@verso.fr');
      const other = await registerUser('other@verso.fr');

      await seedSong({ userId: owner.userId, title: 'Nuit blanche', content: 'rimes nocturnes' });
      await seedSong({ userId: other.userId, title: 'Secret', content: 'jamais visible' });

      const response = await search('q=secret', owner.sessionId);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.items).toHaveLength(0);
      expect(body.total).toBe(0);
    });

    it('trouve les textes par leur titre (insensible à la casse)', async () => {
      const owner = await registerUser('owner@verso.fr');
      await seedSong({ userId: owner.userId, title: 'Mélancolie urbaine', content: 'texte A' });
      await seedSong({ userId: owner.userId, title: 'Freestyle béton', content: 'texte B' });

      const response = await search('q=urbaine', owner.sessionId);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.total).toBe(1);
      expect(body.items[0].title).toBe('Mélancolie urbaine');
    });

    it('trouve les textes par le contenu des paroles', async () => {
      const owner = await registerUser('owner@verso.fr');
      await seedSong({
        userId: owner.userId,
        title: 'Piste une',
        content: "les projecteurs s'éteignent sur le béton mouillé",
      });
      await seedSong({ userId: owner.userId, title: 'Piste deux', content: 'refrain plus doux' });

      const response = await search('q=projecteurs', owner.sessionId);

      const body = response.json();
      expect(body.total).toBe(1);
      expect(body.items[0].excerpt).toContain('projecteurs');
    });
  });

  describe('Filtres combinables', () => {
    it('filtre les brouillons, les textes terminés et les favoris', async () => {
      const owner = await registerUser('owner@verso.fr');
      await seedSong({ userId: owner.userId, title: 'Brouillon', content: 'x', status: 'DRAFT' });
      await seedSong({
        userId: owner.userId,
        title: 'Terminé',
        content: 'x',
        status: 'COMPLETED',
        isFavorite: true,
      });

      const drafts = await search('filter=drafts', owner.sessionId);
      expect(drafts.json().total).toBe(1);
      expect(drafts.json().items[0].title).toBe('Brouillon');

      const completed = await search('filter=completed', owner.sessionId);
      expect(completed.json().total).toBe(1);
      expect(completed.json().items[0].title).toBe('Terminé');

      const favorites = await search('filter=favorites', owner.sessionId);
      expect(favorites.json().total).toBe(1);
      expect(favorites.json().items[0].title).toBe('Terminé');

      const all = await search('filter=all', owner.sessionId);
      expect(all.json().total).toBe(2);
    });

    it('combine la recherche plein texte et le filtre de statut', async () => {
      const owner = await registerUser('owner@verso.fr');
      await seedSong({ userId: owner.userId, title: 'Nuit', content: 'étoiles', status: 'DRAFT' });
      await seedSong({ userId: owner.userId, title: 'Nuit d’été', content: 'étoiles', status: 'COMPLETED' });

      const response = await search('q=nuit&filter=completed', owner.sessionId);

      expect(response.json().total).toBe(1);
      expect(response.json().items[0].status).toBe('COMPLETED');
    });

    it('filtre par tag et par album', async () => {
      const owner = await registerUser('owner@verso.fr');
      const taggedId = await seedSong({
        userId: owner.userId,
        title: 'Colère froide',
        content: 'x',
        tags: ['Colère'],
      });
      await seedSong({ userId: owner.userId, title: 'Sans tag', content: 'x' });
      const albumSongId = await seedSong({
        userId: owner.userId,
        title: 'Morceau d’album',
        content: 'x',
        albumTitle: 'Album Un',
      });

      const byTag = await search('tag=Col%C3%A8re', owner.sessionId);
      expect(byTag.json().total).toBe(1);
      expect(byTag.json().items[0].id).toBe(taggedId);

      const albumRecord = await prisma.song.findUnique({ where: { id: albumSongId } });
      const byAlbum = await search(`albumId=${albumRecord?.albumId}`, owner.sessionId);
      expect(byAlbum.json().total).toBe(1);
      expect(byAlbum.json().items[0].title).toBe('Morceau d’album');
      expect(byAlbum.json().items[0].albumTitle).toBe('Album Un');
    });
  });

  describe('Validation et performance', () => {
    it('rejette une pagination hors limites avec un statut 400', async () => {
      const owner = await registerUser('owner@verso.fr');
      const response = await search('limit=500', owner.sessionId);
      expect(response.statusCode).toBe(400);
    });

    it('rejette une requête sans session avec un statut 401', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/songs?q=nuit' });
      expect(response.statusCode).toBe(401);
    });

    it('retourne les résultats de recherche en moins de 200 ms', async () => {
      const owner = await registerUser('owner@verso.fr');
      for (let index = 0; index < 50; index += 1) {
        await seedSong({
          userId: owner.userId,
          title: `Couplet ${index}`,
          content: `rime numéro ${index} sur le béton`,
        });
      }

      // Préchauffage de la connexion Prisma
      await search('q=rime', owner.sessionId);

      const startedAt = performance.now();
      const response = await search('q=rime', owner.sessionId);
      const elapsed = performance.now() - startedAt;

      expect(response.statusCode).toBe(200);
      expect(response.json().total).toBe(50);
      expect(elapsed).toBeLessThan(200);
    });
  });
});
