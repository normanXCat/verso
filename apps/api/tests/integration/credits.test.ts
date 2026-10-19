import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';
import { clearDatabase } from '../helpers/db.js';

describe("Tests d'intégration : Crédits artistiques et export d'antériorité (/api/songs/:id/credits)", () => {
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
    await clearDatabase();
  });

  async function registerUser(
    email: string,
    displayName?: string,
  ): Promise<{ userId: string; sessionId: string }> {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'Password123!', displayName },
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

  describe('GET /api/songs/:id/credits — Consultation des crédits', () => {
    it('renvoie une liste vide avec totalAuthorPercentage à 0 par défaut', async () => {
      const { userId, sessionId } = await registerUser('credits-owner@verso.fr', 'MC Solaar');

      const song = await prisma.song.create({
        data: {
          title: 'Caroline',
          content: 'Les jours filent...',
          userId,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.credits).toEqual([]);
      expect(body.totalAuthorPercentage).toBe(0);
    });

    it('renvoie 404 (zéro fuite d’information) si un tiers non autorisé tente d’accéder aux crédits', async () => {
      const { userId: ownerId } = await registerUser('song-owner@verso.fr', 'Owner');
      const { sessionId: intruderSession } = await registerUser('intruder@verso.fr', 'Intruder');

      const song = await prisma.song.create({
        data: {
          title: 'Secret Song',
          content: 'Top secret',
          userId: ownerId,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(intruderSession),
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Ressource introuvable');
    });
  });

  describe('PUT /api/songs/:id/credits — Déclaration et mise à jour des crédits', () => {
    it('permet au propriétaire de définir les crédits avec calcul automatique de la quote-part auteur', async () => {
      const { userId, sessionId } = await registerUser('author-a@verso.fr', 'Ali');

      const song = await prisma.song.create({
        data: {
          title: 'Le son qui tue',
          content: 'Couplet 1...',
          userId,
        },
      });

      const payload = {
        credits: [
          {
            name: 'Ali',
            role: 'AUTHOR',
            percentage: 60,
            order: 0,
          },
          {
            name: 'Booba',
            role: 'AUTHOR',
            percentage: 40,
            order: 1,
          },
          {
            name: 'Géraldo',
            role: 'PRODUCER',
            percentage: null,
            order: 2,
          },
          {
            name: 'Animalsons',
            role: 'COMPOSER',
            percentage: null,
            order: 3,
          },
        ],
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(sessionId),
        payload,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.credits.length).toBe(4);
      expect(body.totalAuthorPercentage).toBe(100);

      // Vérification en base
      const inDb = await prisma.songCredit.findMany({
        where: { songId: song.id },
        orderBy: { order: 'asc' },
      });
      expect(inDb.length).toBe(4);
      expect(inDb[0].name).toBe('Ali');
      expect(inDb[0].role).toBe('AUTHOR');
      expect(inDb[0].percentage).toBe(60);
      expect(inDb[3].role).toBe('COMPOSER');
    });

    it('permet à un co-auteur invité de modifier les crédits artistiques', async () => {
      const { userId: ownerId } = await registerUser('owner-collab@verso.fr', 'Owner');
      const { userId: coAuthorId, sessionId: coAuthorSession } = await registerUser(
        'coauthor@verso.fr',
        'CoAuteur',
      );

      const song = await prisma.song.create({
        data: {
          title: 'Morceau partagé',
          content: 'Vers 1...',
          userId: ownerId,
        },
      });

      // Rôle CO_AUTHOR sur le texte
      await prisma.collaborator.create({
        data: {
          userId: coAuthorId,
          songId: song.id,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
          invitedById: ownerId,
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(coAuthorSession),
        payload: {
          credits: [
            {
              name: 'Co-Auteur',
              role: 'AUTHOR',
              percentage: 50,
              order: 0,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().credits.length).toBe(1);
      expect(response.json().totalAuthorPercentage).toBe(50);
    });

    it('interdit la modification des crédits par un simple commentateur ou lecteur (404 zero leak)', async () => {
      const { userId: ownerId } = await registerUser('owner-read@verso.fr', 'Owner');
      const { userId: readerId, sessionId: readerSession } = await registerUser(
        'reader@verso.fr',
        'Lecteur',
      );

      const song = await prisma.song.create({
        data: {
          title: 'Lecture seule',
          content: 'Lecture...',
          userId: ownerId,
        },
      });

      await prisma.collaborator.create({
        data: {
          userId: readerId,
          songId: song.id,
          role: 'READER',
          status: 'ACTIVE',
          invitedById: ownerId,
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(readerSession),
        payload: {
          credits: [{ name: 'Intrus', role: 'AUTHOR', percentage: 100 }],
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Ressource introuvable');
    });

    it('assainit les noms des crédités contre les balises et scripts XSS', async () => {
      const { userId, sessionId } = await registerUser('xss-author@verso.fr', 'Test XSS');

      const song = await prisma.song.create({
        data: {
          title: 'Test XSS Morceau',
          content: 'Texte...',
          userId,
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(sessionId),
        payload: {
          credits: [
            {
              name: '<script>alert("hack")</script>DJ Snake',
              role: 'PRODUCER',
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      const created = response.json().credits[0];
      expect(created.name).not.toContain('<script>');
      expect(created.name).toBe('DJ Snake');
    });

    it('rejette les pourcentages négatifs ou supérieurs à 100', async () => {
      const { userId, sessionId } = await registerUser('val-author@verso.fr', 'Test Val');

      const song = await prisma.song.create({
        data: {
          title: 'Test Validation Morceau',
          content: 'Texte...',
          userId,
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(sessionId),
        payload: {
          credits: [
            {
              name: 'Trop Gourmand',
              role: 'AUTHOR',
              percentage: 120,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("Export PDF d'antériorité enrichi avec crédits (FR-029)", () => {
    it('génère un document PDF contenant les crédits déclarés', async () => {
      const { userId, sessionId } = await registerUser('pdf-author@verso.fr', 'Akhenaton');

      const song = await prisma.song.create({
        data: {
          title: 'Demain c’est loin',
          content: 'De nos jours la vie est courte...',
          userId,
        },
      });

      // Déclarer deux auteurs et un beatmaker
      await app.inject({
        method: 'PUT',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(sessionId),
        payload: {
          credits: [
            {
              name: 'Akhenaton',
              role: 'AUTHOR',
              percentage: 50,
              order: 0,
            },
            {
              name: 'Shurik’n',
              role: 'AUTHOR',
              percentage: 50,
              order: 1,
            },
            {
              name: 'Imhotep',
              role: 'COMPOSER',
              order: 2,
            },
          ],
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/export/pdf`,
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.rawPayload.length).toBeGreaterThan(1000);
      // Le PDF démarre par la signature %PDF
      expect(response.rawPayload.subarray(0, 4).toString()).toBe('%PDF');
    });
  });
});
