import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';
import { clearDatabase } from '../helpers/db.js';

describe("Tests d'intégration : Modération, profil minimal et confidentialité (/api/users, /api/reports)", () => {
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

  describe('GET /api/users/search — Recherche d’artistes anti-énumération (FR-030, FR-031, FR-038)', () => {
    it('trouve un utilisateur par nom d’affichage sans jamais divulguer son email', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');
      await registerUser('bob-secret-email@verso.fr', 'Bob Lyricist');

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/search?q=Bob',
        cookies: authCookie(userA.sessionId),
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBe(1);
      expect(data.users[0].displayName).toBe('Bob Lyricist');
      // STRICTEMENT ZÉRO EMAIL DANS LA RÉPONSE (FR-031)
      expect(data.users[0].email).toBeUndefined();
      expect(JSON.stringify(data)).not.toContain('bob-secret-email@verso.fr');
    });

    it('trouve un utilisateur par email exact sans exposer l’email dans les résultats', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');
      await registerUser('charlie-exact@verso.fr', 'Charlie MC');

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/search?q=charlie-exact@verso.fr',
        cookies: authCookie(userA.sessionId),
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.users.length).toBe(1);
      expect(data.users[0].displayName).toBe('Charlie MC');
      expect(data.users[0].email).toBeUndefined();
      expect(JSON.stringify(data)).not.toContain('charlie-exact@verso.fr');
    });

    it('exclut l’utilisateur qui effectue la recherche', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/search?q=Alice',
        cookies: authCookie(userA.sessionId),
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.users.length).toBe(0);
    });

    it('exclut réciproquement les utilisateurs bloqués des résultats de recherche (FR-032)', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');
      const userB = await registerUser('bob@verso.fr', 'Bob Bloqué');

      // Alice bloque Bob
      await prisma.userBlock.create({
        data: {
          blockerId: userA.userId,
          blockedId: userB.userId,
        },
      });

      // Alice cherche Bob -> Bob n'apparaît pas
      const resA = await app.inject({
        method: 'GET',
        url: '/api/users/search?q=Bob',
        cookies: authCookie(userA.sessionId),
      });
      expect(resA.json().users.length).toBe(0);

      // Bob cherche Alice -> Alice n'apparaît pas
      const resB = await app.inject({
        method: 'GET',
        url: '/api/users/search?q=Alice',
        cookies: authCookie(userB.sessionId),
      });
      expect(resB.json().users.length).toBe(0);
    });
  });

  describe('GET /api/users/:id/profile — Consultation de profil minimal (FR-030, FR-031)', () => {
    it('retourne le profil minimal (nom, avatar, bio) sans email', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');
      const userB = await registerUser('bob-private@verso.fr', 'Bob Poète');

      await prisma.user.update({
        where: { id: userB.userId },
        data: { bio: 'Auteur hip-hop & slam de banlieue parisienne.' },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${userB.userId}/profile`,
        cookies: authCookie(userA.sessionId),
      });

      expect(response.statusCode).toBe(200);
      const profile = response.json();
      expect(profile.id).toBe(userB.userId);
      expect(profile.displayName).toBe('Bob Poète');
      expect(profile.bio).toBe('Auteur hip-hop & slam de banlieue parisienne.');
      // ZÉRO DIVULGATION D'EMAIL (FR-031)
      expect(profile.email).toBeUndefined();
      expect(JSON.stringify(profile)).not.toContain('bob-private@verso.fr');
    });

    it('renvoie 404 (zéro fuite d’information) si l’utilisateur est bloqué bilatéralement', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');
      const userB = await registerUser('bob@verso.fr', 'Bob Bloqué');

      await prisma.userBlock.create({
        data: {
          blockerId: userA.userId,
          blockedId: userB.userId,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${userB.userId}/profile`,
        cookies: authCookie(userA.sessionId),
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Utilisateur introuvable');
    });
  });

  describe('PATCH /api/users/profile — Mise à jour de sa biographie et de son profil', () => {
    it('permet de mettre à jour son nom et sa biographie (max 280 caractères)', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/users/profile',
        cookies: authCookie(userA.sessionId),
        payload: {
          displayName: 'Alice Nouvelle Plume',
          bio: 'Auteure compositrice indépendante.',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.displayName).toBe('Alice Nouvelle Plume');
      expect(body.bio).toBe('Auteure compositrice indépendante.');

      const updated = await prisma.user.findUnique({ where: { id: userA.userId } });
      expect(updated?.displayName).toBe('Alice Nouvelle Plume');
      expect(updated?.bio).toBe('Auteure compositrice indépendante.');
    });

    it('rejette une biographie de plus de 280 caractères avec un code 400', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');

      const tooLongBio = 'a'.repeat(281);
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/users/profile',
        cookies: authCookie(userA.sessionId),
        payload: {
          bio: tooLongBio,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/users/:id/block & DELETE /api/users/:id/block — Modération et rupture bilatérale (FR-032)', () => {
    it('interdit de se bloquer soi-même avec un code 400', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');

      const response = await app.inject({
        method: 'POST',
        url: `/api/users/${userA.userId}/block`,
        cookies: authCookie(userA.sessionId),
      });

      expect(response.statusCode).toBe(400);
    });

    it('bloque un utilisateur avec rupture bilatérale immédiate sur œuvres et invitations (FR-032)', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');
      const userB = await registerUser('bob@verso.fr', 'Bob Bloqué');

      // Création d'une œuvre détenue par Alice avec Bob en co-auteur
      const songA = await prisma.song.create({
        data: {
          title: 'Titre Alice',
          content: 'Paroles Alice',
          userId: userA.userId,
        },
      });
      await prisma.collaborator.create({
        data: {
          songId: songA.id,
          userId: userB.userId,
          invitedById: userA.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
      });

      // Création d'une œuvre détenue par Bob avec Alice en lectrice
      const songB = await prisma.song.create({
        data: {
          title: 'Titre Bob',
          content: 'Paroles Bob',
          userId: userB.userId,
        },
      });
      await prisma.collaborator.create({
        data: {
          songId: songB.id,
          userId: userA.userId,
          invitedById: userB.userId,
          role: 'READER',
          status: 'ACTIVE',
        },
      });

      // Invitation en attente de Bob vers Alice
      await prisma.invitation.create({
        data: {
          tokenHash: 'pending-token-hash-bob-alice',
          songId: songB.id,
          inviterId: userB.userId,
          invitedUserId: userA.userId,
          role: 'CO_AUTHOR',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      // Alice bloque Bob
      const blockRes = await app.inject({
        method: 'POST',
        url: `/api/users/${userB.userId}/block`,
        cookies: authCookie(userA.sessionId),
      });

      expect(blockRes.statusCode).toBe(200);

      // 1. Accès de Bob sur les œuvres d'Alice : RÉVOQUÉ
      const collabBOnA = await prisma.collaborator.findFirst({
        where: { songId: songA.id, userId: userB.userId },
      });
      expect(collabBOnA?.status).toBe('REVOKED');

      // 2. Accès d'Alice sur les œuvres de Bob : RETIRÉ (LEFT)
      const collabAOnB = await prisma.collaborator.findFirst({
        where: { songId: songB.id, userId: userA.userId },
      });
      expect(collabAOnB?.status).toBe('LEFT');

      // 3. Invitations en cours : RÉVOQUÉES
      const pendingInv = await prisma.invitation.findFirst({
        where: { tokenHash: 'pending-token-hash-bob-alice' },
      });
      expect(pendingInv?.status).toBe('REVOKED');

      // 4. Liste des utilisateurs bloqués
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/users/blocked',
        cookies: authCookie(userA.sessionId),
      });
      expect(listRes.statusCode).toBe(200);
      const listData = listRes.json();
      expect(listData.blockedUsers.length).toBe(1);
      expect(listData.blockedUsers[0].id).toBe(userB.userId);

      // 5. Déblocage
      const unblockRes = await app.inject({
        method: 'DELETE',
        url: `/api/users/${userB.userId}/block`,
        cookies: authCookie(userA.sessionId),
      });
      expect(unblockRes.statusCode).toBe(200);

      const blockCount = await prisma.userBlock.count({
        where: { blockerId: userA.userId, blockedId: userB.userId },
      });
      expect(blockCount).toBe(0);
    });
  });

  describe('POST /api/reports — Signalement de contenu ou comportement abusif (FR-033)', () => {
    it('enregistre un signalement d’abus avec motif valide et détails', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');
      const userB = await registerUser('bob@verso.fr', 'Bob Accusé');

      const response = await app.inject({
        method: 'POST',
        url: '/api/reports',
        cookies: authCookie(userA.sessionId),
        payload: {
          reason: 'HARASSMENT',
          details: 'Cet utilisateur envoie des commentaires répétés et insistants.',
          reportedUserId: userB.userId,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.id).toBeDefined();

      const report = await prisma.abuseReport.findUnique({
        where: { id: body.id },
      });
      expect(report).toBeDefined();
      expect(report?.reason).toBe('HARASSMENT');
      expect(report?.reporterId).toBe(userA.userId);
      expect(report?.reportedUserId).toBe(userB.userId);
      expect(report?.status).toBe('PENDING');
    });

    it('rejette un motif de signalement invalide', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');

      const response = await app.inject({
        method: 'POST',
        url: '/api/reports',
        cookies: authCookie(userA.sessionId),
        payload: {
          reason: 'MOTIF_INVENTE',
          details: 'Test',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/songs/:id/activity — Journal d’activité récente d’un texte (FR-034)', () => {
    it('renvoie la chronologie des modifications, commentaires et collaborateurs', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');
      const userB = await registerUser('bob@verso.fr', 'Bob Coauteur');

      const song = await prisma.song.create({
        data: {
          title: 'Épopée Nocturne',
          content: 'Couplet 1...',
          userId: userA.userId,
        },
      });

      // Collaboration
      await prisma.collaborator.create({
        data: {
          songId: song.id,
          userId: userB.userId,
          invitedById: userA.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
      });

      // Version archivée
      await prisma.songVersion.create({
        data: {
          songId: song.id,
          title: 'Épopée Nocturne (v1)',
          content: 'Premier jet',
          authorId: userB.userId,
        },
      });

      // Commentaire
      await prisma.comment.create({
        data: {
          songId: song.id,
          authorId: userA.userId,
          content: 'Très bon flow sur cette rime',
          startLine: 1,
          endLine: 4,
          isResolved: false,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/activity`,
        cookies: authCookie(userA.sessionId),
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(Array.isArray(data.activities)).toBe(true);
      expect(data.activities.length).toBeGreaterThanOrEqual(3);

      const actions = data.activities.map((a: { action: string }) => a.action);
      expect(actions).toContain('edit');
      expect(actions).toContain('comment');
      expect(actions).toContain('invite');
    });

    it('renvoie 404 (zéro fuite d’information) pour un utilisateur non autorisé', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');
      const userC = await registerUser('charlie-inconnu@verso.fr', 'Charlie');

      const song = await prisma.song.create({
        data: {
          title: 'Secret Alice',
          content: 'Texte confidentiel',
          userId: userA.userId,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/activity`,
        cookies: authCookie(userC.sessionId),
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Ressource introuvable');
    });
  });
});
