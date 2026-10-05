import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';
import * as emailService from '../../src/modules/auth/email.service.js';

vi.mock('../../src/modules/auth/email.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/modules/auth/email.service.js')>();
  return {
    ...actual,
    sendVerificationEmail: vi.fn(actual.sendVerificationEmail),
    sendPasswordResetEmail: vi.fn(actual.sendPasswordResetEmail),
  };
});

describe("Tests d'intégration : robustesse (santé, erreurs, inscription)", () => {
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
    vi.mocked(emailService.sendVerificationEmail).mockClear();
  });

  describe('GET /health', () => {
    it('renvoie 200 et confirme la base lorsque PostgreSQL répond', async () => {
      const response = await app.inject({ method: 'GET', url: '/health' });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe('ok');
      expect(body.database).toBe('up');
    });
  });

  describe('POST /api/auth/register — inscription complète', () => {
    it('crée le compte, émet le cookie de session et déclenche l’email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'inscription-complete@verso.fr',
          password: 'Password123!',
          displayName: 'MC Robustesse',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.user.email).toBe('inscription-complete@verso.fr');
      expect(body.message).toContain('Compte créé avec succès');

      const sessionCookie = response.cookies.find((c) => c.name === 'session_id');
      expect(sessionCookie).toBeDefined();

      const persisted = await prisma.user.findUnique({
        where: { email: 'inscription-complete@verso.fr' },
      });
      expect(persisted).not.toBeNull();
      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });

    it('crée le compte même si l’envoi de l’email échoue (jamais de 500)', async () => {
      vi.mocked(emailService.sendVerificationEmail).mockRejectedValueOnce(
        new Error('Passerelle email indisponible'),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'email-ko@verso.fr', password: 'Password123!' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().message).toContain('a échoué');

      const persisted = await prisma.user.findUnique({ where: { email: 'email-ko@verso.fr' } });
      expect(persisted).not.toBeNull();
    });
  });

  describe('Gestionnaire d’erreurs global', () => {
    it('renvoie un 503 générique et un identifiant de requête si la base est indisponible', async () => {
      const dbError = new Prisma.PrismaClientInitializationError(
        "Can't reach database server at `localhost:5432` — password=SuperSecretValue",
        'P1001',
      );
      vi.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(dbError);

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'db-down@verso.fr', password: 'Password123!' },
      });

      expect(response.statusCode).toBe(503);
      const body = response.json();
      expect(typeof body.requestId).toBe('string');
      expect(body.requestId.length).toBeGreaterThan(0);
      expect(body.message).toBe(
        'Un problème est survenu de notre côté. Réessayez dans un instant.',
      );
      // Aucune fuite : ni pile, ni message interne, ni secret.
      const serialized = JSON.stringify(body);
      expect(serialized).not.toContain('Prisma');
      expect(serialized).not.toContain('SuperSecretValue');
      expect(serialized).not.toContain('stack');
    });

    it('ne divulgue jamais le détail d’une erreur inattendue (pas de pile, message générique)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(
        new Error('Détail interne confidentiel: token=abc123'),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'unexpected@verso.fr', password: 'Password123!' },
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body.message).toBe(
        'Un problème est survenu de notre côté. Réessayez dans un instant.',
      );
      expect(typeof body.requestId).toBe('string');
      const serialized = JSON.stringify(body);
      expect(serialized).not.toContain('abc123');
      expect(serialized).not.toContain('confidentiel');
    });
  });
});
