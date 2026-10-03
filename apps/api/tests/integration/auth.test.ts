import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

describe("Tests d'intégration : Authentification et Sessions (/api/auth)", () => {
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
    // Nettoyer les données de test entre chaque scénario
    await prisma.emailToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    it('doit créer un nouvel utilisateur et retourner 201 avec un cookie de session HttpOnly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'artiste@verso.fr',
          password: 'Password123!',
          displayName: 'MC Plume',
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.user).toBeDefined();
      expect(json.user.email).toBe('artiste@verso.fr');
      expect(json.user.displayName).toBe('MC Plume');
      expect(json.user.emailVerified).toBeNull();
      expect(json.message).toContain('Compte créé avec succès');

      // Vérifier la présence du cookie session_id
      const cookies = response.cookies;
      const sessionCookie = cookies.find((c) => c.name === 'session_id');
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.httpOnly).toBe(true);
      expect(sessionCookie?.sameSite).toBe('Lax');
    });

    it('doit retourner 400 si le mot de passe ne respecte pas les critères de sécurité', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'artiste@verso.fr',
          password: 'faible',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('doit retourner 409 si un compte existe déjà avec cette adresse email', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'artiste@verso.fr',
          password: 'Password123!',
        },
      });

      const duplicate = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'artiste@verso.fr',
          password: 'AnotherPassword123!',
        },
      });

      expect(duplicate.statusCode).toBe(409);
      expect(duplicate.json().message).toContain('existe déjà');
    });
  });

  describe('POST /api/auth/login', () => {
    it("doit authentifier l'utilisateur avec les bons identifiants et émettre un cookie", async () => {
      // Inscription préalable
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'login-test@verso.fr',
          password: 'Password123!',
          displayName: 'Rappeur Test',
        },
      });

      // Connexion
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'login-test@verso.fr',
          password: 'Password123!',
          rememberMe: true,
        },
      });

      expect(loginRes.statusCode).toBe(200);
      const json = loginRes.json();
      expect(json.user.email).toBe('login-test@verso.fr');

      const sessionCookie = loginRes.cookies.find((c) => c.name === 'session_id');
      expect(sessionCookie).toBeDefined();
    });

    it('doit retourner 401 avec message générique si le mot de passe est erroné', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'login-wrong@verso.fr',
          password: 'Password123!',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'login-wrong@verso.fr',
          password: 'WrongPassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().message).toContain('Identifiants incorrects');
    });
  });

  describe('GET /api/auth/me et POST /api/auth/logout', () => {
    it("doit retourner l'utilisateur connecté puis interdire l'accès après déconnexion", async () => {
      // Inscription
      const regRes = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'me-test@verso.fr',
          password: 'Password123!',
        },
      });

      const sessionCookie = regRes.cookies.find((c) => c.name === 'session_id');
      expect(sessionCookie).toBeDefined();

      // Accès /me avec cookie
      const meRes = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        cookies: {
          session_id: sessionCookie?.value || '',
        },
      });

      expect(meRes.statusCode).toBe(200);
      expect(meRes.json().user.email).toBe('me-test@verso.fr');

      // Déconnexion
      const logoutRes = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        cookies: {
          session_id: sessionCookie?.value || '',
        },
      });

      expect(logoutRes.statusCode).toBe(200);

      // Accès /me après déconnexion doit renvoyer 401
      const meAfterLogout = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        cookies: {
          session_id: sessionCookie?.value || '',
        },
      });

      expect(meAfterLogout.statusCode).toBe(401);
    });

    it("doit rejeter /api/auth/me si aucun cookie de session n'est fourni", async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/verify-email', () => {
    it("doit marquer l'email comme vérifié avec un token valide", async () => {
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'verify@verso.fr',
          password: 'Password123!',
        },
      });

      // Récupérer le token généré
      const tokenRecord = await prisma.emailToken.findFirst({
        where: { email: 'verify@verso.fr', type: 'VERIFY_EMAIL' },
      });
      expect(tokenRecord).toBeDefined();

      const verifyRes = await app.inject({
        method: 'GET',
        url: `/api/auth/verify-email?token=${tokenRecord?.id}`,
      });

      expect(verifyRes.statusCode).toBe(200);

      const user = await prisma.user.findUnique({ where: { email: 'verify@verso.fr' } });
      expect(user?.emailVerified).not.toBeNull();
    });

    it('doit rejeter un token invalide avec un statut 400', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/verify-email?token=invalid-token',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/forgot-password et /api/auth/reset-password', () => {
    it('doit envoyer un lien générique puis réinitialiser le mot de passe avec le token', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'reset@verso.fr',
          password: 'OldPassword123!',
        },
      });

      // Demande de reset
      const forgotRes = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: { email: 'reset@verso.fr' },
      });

      expect(forgotRes.statusCode).toBe(200);
      expect(forgotRes.json().message).toContain('Si cette adresse existe');

      const tokenRecord = await prisma.emailToken.findFirst({
        where: { email: 'reset@verso.fr', type: 'RESET_PASSWORD' },
      });
      expect(tokenRecord).toBeDefined();

      // Soumission du nouveau mot de passe
      const resetRes = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: {
          token: tokenRecord?.id,
          newPassword: 'NewPassword123!',
        },
      });

      expect(resetRes.statusCode).toBe(200);

      // L'ancien mot de passe ne doit plus fonctionner
      const oldLogin = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'reset@verso.fr', password: 'OldPassword123!' },
      });
      expect(oldLogin.statusCode).toBe(401);

      // Le nouveau mot de passe doit fonctionner
      const newLogin = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'reset@verso.fr', password: 'NewPassword123!' },
      });
      expect(newLogin.statusCode).toBe(200);
    });
  });

  describe('GET /api/auth/sessions et DELETE /api/auth/sessions/:id', () => {
    it('doit lister les sessions actives et révoquer une session distante', async () => {
      const regRes = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'sessions-test@verso.fr',
          password: 'Password123!',
        },
      });

      const sessionCookie = regRes.cookies.find((c) => c.name === 'session_id');

      const listRes = await app.inject({
        method: 'GET',
        url: '/api/auth/sessions',
        cookies: { session_id: sessionCookie?.value || '' },
      });

      expect(listRes.statusCode).toBe(200);
      const sessions = listRes.json();
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].isCurrent).toBe(true);
    });
  });
});
