import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

const ALLOWED_ORIGIN = 'http://localhost:5173';
const EVIL_ORIGIN = 'https://attaquant.example';

describe("Tests d'intégration : audit de sécurité (en-têtes, CORS, CSRF, isolation)", () => {
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

  describe('En-têtes de sécurité (Helmet)', () => {
    it('applique les en-têtes de durcissement sur toutes les réponses', async () => {
      const response = await app.inject({ method: 'GET', url: '/health' });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['referrer-policy']).toBeDefined();
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['cross-origin-opener-policy']).toBeDefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS restrictif', () => {
    it("autorise l'origine configurée (CLIENT_URL)", async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/songs',
        headers: {
          origin: ALLOWED_ORIGIN,
          'access-control-request-method': 'POST',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('ne reflète jamais une origine étrangère', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/songs',
        headers: {
          origin: EVIL_ORIGIN,
          'access-control-request-method': 'POST',
        },
      });

      expect(response.headers['access-control-allow-origin']).not.toBe(EVIL_ORIGIN);
    });
  });

  describe("Protection CSRF (validation d'origine)", () => {
    it("refuse une écriture dont l'origine est étrangère", async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers: { origin: EVIL_ORIGIN },
        payload: { email: 'csrf-evil@verso.fr', password: 'Password123!' },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().message).toContain('origine non autorisée');
    });

    it("refuse une écriture dont l'origine est valide mais le référent étranger", async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers: { referer: `${EVIL_ORIGIN}/page` },
        payload: { email: 'csrf-referer@verso.fr', password: 'Password123!' },
      });

      expect(response.statusCode).toBe(403);
    });

    it("accepte une écriture provenant de l'origine légitime", async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers: { origin: ALLOWED_ORIGIN },
        payload: { email: 'csrf-ok@verso.fr', password: 'Password123!' },
      });

      expect(response.statusCode).toBe(201);
    });

    it('laisse passer les requêtes non-navigateur (sans Origin ni Referer)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'csrf-server@verso.fr', password: 'Password123!' },
      });

      expect(response.statusCode).toBe(201);
    });

    it('ne bloque jamais les lectures (GET)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: { origin: EVIL_ORIGIN },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Isolation multi-tenant (anti-IDOR)', () => {
    it("interdit à un utilisateur d'accéder, modifier ou supprimer le texte d'un autre", async () => {
      const owner = await registerUser('owner@verso.fr');
      const intruder = await registerUser('intruder@verso.fr');

      const created = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: { session_id: owner.sessionId },
        payload: { title: 'Confidentiel', content: 'texte privé' },
      });
      expect(created.statusCode).toBe(201);
      const songId = created.json().id as string;

      const read = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}`,
        cookies: { session_id: intruder.sessionId },
      });
      expect(read.statusCode).toBe(404);

      const update = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${songId}`,
        cookies: { session_id: intruder.sessionId },
        payload: { title: 'Piraté' },
      });
      expect(update.statusCode).toBe(404);

      const remove = await app.inject({
        method: 'DELETE',
        url: `/api/songs/${songId}`,
        cookies: { session_id: intruder.sessionId },
      });
      expect(remove.statusCode).toBe(404);

      // Le propriétaire conserve intact son texte
      const stillThere = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}`,
        cookies: { session_id: owner.sessionId },
      });
      expect(stillThere.statusCode).toBe(200);
      expect(stillThere.json().title).toBe('Confidentiel');
    });
  });

  describe('Absence de fuite de données sensibles', () => {
    it('ne divulgue jamais le hash de mot de passe dans les réponses utilisateur', async () => {
      const { sessionId } = await registerUser('leak@verso.fr');

      const me = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        cookies: { session_id: sessionId },
      });

      expect(me.statusCode).toBe(200);
      expect(JSON.stringify(me.json())).not.toContain('passwordHash');
      expect(me.json().user).not.toHaveProperty('passwordHash');
    });
  });
});
