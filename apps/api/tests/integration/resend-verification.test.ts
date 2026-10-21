import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';
import { createSession } from '../../src/modules/auth/session.service.js';
import * as emailService from '../../src/modules/auth/email.service.js';

vi.mock('../../src/modules/auth/email.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/modules/auth/email.service.js')>();
  return {
    ...actual,
    sendVerificationEmail: vi.fn(actual.sendVerificationEmail),
  };
});

describe(
  'Tests d’intégration : POST sans corps et renvoi d’email de vérification',
  { timeout: 20000 },
  () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = await buildApp();
      await app.ready();
      await prisma.emailToken.deleteMany();
      await prisma.session.deleteMany();
      await prisma.user.deleteMany();
    }, 30000);

    afterAll(async () => {
      await app.close();
      await prisma.$disconnect();
    });

    beforeEach(async () => {
      await prisma.emailToken.deleteMany();
      await prisma.session.deleteMany();
      await prisma.user.deleteMany();
      vi.mocked(emailService.sendVerificationEmail).mockClear();
    }, 30000);

    describe('POST sans corps : avec et sans Content-Type', () => {
      it('accepte un POST sans corps avec Content-Type: application/json sur route allowEmptyBody (/api/auth/logout)', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/logout',
          headers: {
            'content-type': 'application/json',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().message).toContain('Déconnexion réussie');
      });

      it('accepte un POST sans corps SANS Content-Type sur route allowEmptyBody (/api/auth/logout)', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/logout',
          headers: {},
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().message).toContain('Déconnexion réussie');
      });

      it('accepte un POST avec corps whitespace et Content-Type: application/json sur route allowEmptyBody', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/logout',
          headers: {
            'content-type': 'application/json',
          },
          payload: '   ',
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().message).toContain('Déconnexion réussie');
      });

      it('rejette un POST sans corps avec Content-Type: application/json sur route exigeant un corps (/api/auth/login)', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: {
            'content-type': 'application/json',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().message).toBe(
          "Body cannot be empty when content-type is set to 'application/json'",
        );
      });
    });

    describe('POST /api/auth/resend-verification', () => {
      async function createTestUser(email: string, emailVerified: Date | null = null) {
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash: 'dummy_hash',
            displayName: 'Artiste Test',
            emailVerified,
          },
        });

        const session = await createSession({
          userId: user.id,
        });

        return { cookie: `session_id=${session.id}` };
      }

      it('renvoie 401 si la requête n’est pas authentifiée', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/resend-verification',
        });

        expect(response.statusCode).toBe(401);
      });

      it('renvoie 400 si l’adresse email est déjà vérifiée', async () => {
        const { cookie } = await createTestUser('deja-verifie@verso.fr', new Date());

        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/resend-verification',
          headers: { cookie },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().message).toBe('Votre adresse email est déjà vérifiée.');
      });

      it('renvoie 200 en cas de succès avec ou sans Content-Type', async () => {
        vi.mocked(emailService.sendVerificationEmail).mockResolvedValueOnce(true);
        const { cookie } = await createTestUser('non-verifie@verso.fr');

        // Test avec Content-Type: application/json sans corps
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/resend-verification',
          headers: {
            cookie,
            'content-type': 'application/json',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().message).toBe('Un nouvel email de vérification vous a été envoyé.');
        expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);

        // Vérifier que le token a bien été créé en base
        const token = await prisma.emailToken.findFirst({
          where: { email: 'non-verifie@verso.fr', type: 'VERIFY_EMAIL' },
        });
        expect(token).not.toBeNull();
      });

      it('renvoie 429 avec retry-after et message clair si la limite de 1 minute est atteinte', async () => {
        vi.mocked(emailService.sendVerificationEmail).mockResolvedValue(true);
        const { cookie } = await createTestUser('cooldown@verso.fr');

        // Premier appel -> succès
        const res1 = await app.inject({
          method: 'POST',
          url: '/api/auth/resend-verification',
          headers: { cookie },
        });
        expect(res1.statusCode).toBe(200);

        // Deuxième appel immédiat -> 429
        const res2 = await app.inject({
          method: 'POST',
          url: '/api/auth/resend-verification',
          headers: { cookie },
        });

        expect(res2.statusCode).toBe(429);
        const body = res2.json();
        expect(body.message).toMatch(/^Réessaie dans \d+ secondes$/);
        expect(body.retryAfterSeconds).toBeGreaterThan(0);
        expect(body.retryAfterSeconds).toBeLessThanOrEqual(60);
        expect(res2.headers['retry-after']).toBe(String(body.retryAfterSeconds));
      });

      it('renvoie 429 si la limite de 5 envois par heure est dépassée', async () => {
        vi.mocked(emailService.sendVerificationEmail).mockResolvedValue(true);
        const { cookie } = await createTestUser('hourly-limit@verso.fr');

        // Créer 5 tokens récents espacés de 2 minutes dans l'heure passée
        const now = Date.now();
        for (let i = 5; i >= 1; i--) {
          await prisma.emailToken.create({
            data: {
              email: 'hourly-limit@verso.fr',
              tokenHash: `hash-${i}`,
              type: 'VERIFY_EMAIL',
              expiresAt: new Date(now + 24 * 3600 * 1000),
              createdAt: new Date(now - i * 2 * 60 * 1000), // il y a 10, 8, 6, 4, 2 min
            },
          });
        }

        // La dernière était il y a 2 minutes (donc pas bloqué par la limite de 1 minute),
        // mais 5 ont déjà été envoyés dans l'heure
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/resend-verification',
          headers: { cookie },
        });

        expect(response.statusCode).toBe(429);
        expect(response.json().message).toContain('Trop de tentatives de renvoi');
        expect(response.headers['retry-after']).toBe('3600');
      });

      it('renvoie 502 avec un message clair si l’envoi de l’email par le fournisseur échoue (pas de 500 brut)', async () => {
        const { cookie } = await createTestUser('fournisseur-ko@verso.fr');
        vi.mocked(emailService.sendVerificationEmail).mockResolvedValueOnce(false);

        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/resend-verification',
          headers: { cookie },
        });

        expect(response.statusCode).toBe(502);
        expect(response.json().message).toBe(
          "Impossible d'envoyer l'email pour le moment. Réessaie dans quelques minutes.",
        );
      });

      it('renvoie 502 si le fournisseur lève une exception inattendue', async () => {
        const { cookie } = await createTestUser('fournisseur-crash@verso.fr');
        vi.mocked(emailService.sendVerificationEmail).mockRejectedValueOnce(
          new Error('Réseau SMTP / API Resend indisponible'),
        );

        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/resend-verification',
          headers: { cookie },
        });

        expect(response.statusCode).toBe(502);
        expect(response.json().message).toBe(
          "Impossible d'envoyer l'email pour le moment. Réessaie dans quelques minutes.",
        );
      });
    });
  },
);
