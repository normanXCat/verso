import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';
import { clearDatabase } from '../helpers/db.js';

describe("Tests d'intégration : Audit de sécurité multi-tenant IDOR et validation Quickstart (Phase 11)", () => {
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

  describe('T075 & T077 — Audit de sécurité multi-tenant et IDOR (Zéro fuite d’existence 404)', () => {
    it('renvoie systématiquement 404 (sans aucun 403 ni fuite d’existence) sur tous les endpoints pour un utilisateur non autorisé', async () => {
      const owner = await registerUser('owner@verso.fr', 'Artiste Propriétaire');
      const attacker = await registerUser('attacker@verso.fr', 'Attaquant Malveillant');

      // Création d'une œuvre privée
      const song = await prisma.song.create({
        data: {
          title: 'Titre Confidentiel',
          content: 'Paroles secrètes...',
          userId: owner.userId,
        },
      });

      // Création d'un commentaire existant sur ce texte
      const commentRes = await app.inject({
        method: 'POST',
        url: `/api/songs/${song.id}/comments`,
        cookies: authCookie(owner.sessionId),
        payload: {
          content: 'Note privée de l’auteur',
          startLine: 1,
          endLine: 1,
        },
      });
      const commentId = commentRes.json().comment.id as string;

      // 1. Consultation de l'œuvre
      const getSongRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}`,
        cookies: authCookie(attacker.sessionId),
      });
      expect(getSongRes.statusCode).toBe(404);
      expect(getSongRes.json().message).toMatch(/introuvable/i);

      // 2. Modification de l'œuvre
      const patchSongRes = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${song.id}`,
        cookies: authCookie(attacker.sessionId),
        payload: { content: 'Piraté !' },
      });
      expect(patchSongRes.statusCode).toBe(404);

      // 3. Suppression de l'œuvre
      const deleteSongRes = await app.inject({
        method: 'DELETE',
        url: `/api/songs/${song.id}`,
        cookies: authCookie(attacker.sessionId),
      });
      expect(deleteSongRes.statusCode).toBe(404);

      // 4. Liste des collaborateurs
      const getCollabRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/collaborators`,
        cookies: authCookie(attacker.sessionId),
      });
      expect(getCollabRes.statusCode).toBe(404);

      // 5. Envoi d'une invitation
      const postInviteRes = await app.inject({
        method: 'POST',
        url: `/api/songs/${song.id}/invitations`,
        cookies: authCookie(attacker.sessionId),
        payload: { recipient: 'autre@verso.fr', role: 'CO_AUTHOR' },
      });
      expect(postInviteRes.statusCode).toBe(404);

      // 6. Liste des commentaires
      const getCommentsRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/comments`,
        cookies: authCookie(attacker.sessionId),
      });
      expect(getCommentsRes.statusCode).toBe(404);

      // 7. Dépôt de commentaire
      const postCommentRes = await app.inject({
        method: 'POST',
        url: `/api/songs/${song.id}/comments`,
        cookies: authCookie(attacker.sessionId),
        payload: { content: 'Spam !', startLine: 1, endLine: 1 },
      });
      expect(postCommentRes.statusCode).toBe(404);

      // 8. Réponse à un commentaire
      const replyCommentRes = await app.inject({
        method: 'POST',
        url: `/api/comments/${commentId}/replies`,
        cookies: authCookie(attacker.sessionId),
        payload: { content: 'Réponse pirate' },
      });
      expect(replyCommentRes.statusCode).toBe(404);

      // 9. Résolution d'un commentaire
      const resolveCommentRes = await app.inject({
        method: 'PATCH',
        url: `/api/comments/${commentId}/resolve`,
        cookies: authCookie(attacker.sessionId),
      });
      expect(resolveCommentRes.statusCode).toBe(404);

      // 10. Crédits artistiques
      const getCreditsRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(attacker.sessionId),
      });
      expect(getCreditsRes.statusCode).toBe(404);

      const putCreditsRes = await app.inject({
        method: 'PUT',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(attacker.sessionId),
        payload: { credits: [{ name: 'Hacker', role: 'AUTHOR', percentage: 100 }] },
      });
      expect(putCreditsRes.statusCode).toBe(404);

      // 11. Historique des versions
      const getVersionsRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/versions`,
        cookies: authCookie(attacker.sessionId),
      });
      expect(getVersionsRes.statusCode).toBe(404);

      // 12. Export PDF d'antériorité
      const exportPdfRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/export/pdf`,
        cookies: authCookie(attacker.sessionId),
      });
      expect(exportPdfRes.statusCode).toBe(404);

      // 13. Fil d'activité
      const activityRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/activity`,
        cookies: authCookie(attacker.sessionId),
      });
      expect(activityRes.statusCode).toBe(404);
    });

    it('interdit à un simple lecteur ou commentateur de modifier les droits, crédits ou le texte', async () => {
      const owner = await registerUser('owner2@verso.fr', 'Auteur Titulaire');
      const viewer = await registerUser('viewer@verso.fr', 'Simple Lecteur');

      const song = await prisma.song.create({
        data: { title: 'Titre Partagé', content: 'Contenu original', userId: owner.userId },
      });

      // Accès accordé en tant que READER
      await prisma.collaborator.create({
        data: {
          songId: song.id,
          userId: viewer.userId,
          invitedById: owner.userId,
          role: 'READER',
          status: 'ACTIVE',
        },
      });

      // Le lecteur peut lire le texte
      const readRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}`,
        cookies: authCookie(viewer.sessionId),
      });
      expect(readRes.statusCode).toBe(200);

      // Le lecteur ne peut pas modifier le texte (404 anti-fuite)
      const editRes = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${song.id}`,
        cookies: authCookie(viewer.sessionId),
        payload: { content: 'Modification non autorisée' },
      });
      expect(editRes.statusCode).toBe(404);

      // Le lecteur ne peut pas modifier les crédits
      const creditsRes = await app.inject({
        method: 'PUT',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(viewer.sessionId),
        payload: { credits: [{ name: 'Lecteur', role: 'AUTHOR', percentage: 100 }] },
      });
      expect(creditsRes.statusCode).toBe(404);

      // Le lecteur ne peut pas inviter d'autres personnes
      const inviteRes = await app.inject({
        method: 'POST',
        url: `/api/songs/${song.id}/invitations`,
        cookies: authCookie(viewer.sessionId),
        payload: { recipient: 'autre@verso.fr', role: 'CO_AUTHOR' },
      });
      expect(inviteRes.statusCode).toBe(404);
    });
  });

  describe('T076 — Validation des 5 scénarios de Quickstart (quickstart.md)', () => {
    it('Scénario 1 : Cycle d’invitation, acceptation et consultation dans l’espace partagé (P1)', async () => {
      // 1. Création des artistes
      const ali = await registerUser('ali@verso.fr', 'Ali');
      const booba = await registerUser('booba@verso.fr', 'Booba');

      // 2. Création du texte par Ali
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(ali.sessionId),
        payload: { title: 'Temps Mort', content: 'Dans l’arène…' },
      });
      expect(createRes.statusCode).toBe(201);
      const songId = createRes.json().id as string;

      // 3. Tentative d'accès non autorisé par Booba -> 404
      const deniedRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}`,
        cookies: authCookie(booba.sessionId),
      });
      expect(deniedRes.statusCode).toBe(404);

      // 4. Envoi d'invitation par Ali
      const inviteRes = await app.inject({
        method: 'POST',
        url: `/api/songs/${songId}/invitations`,
        cookies: authCookie(ali.sessionId),
        payload: { recipient: 'booba@verso.fr', role: 'CO_AUTHOR' },
      });
      expect(inviteRes.statusCode).toBe(201);

      // 5. Booba consulte ses invitations
      const listInvitesRes = await app.inject({
        method: 'GET',
        url: '/api/invitations',
        cookies: authCookie(booba.sessionId),
      });
      expect(listInvitesRes.statusCode).toBe(200);
      const invites = listInvitesRes.json();
      expect(Array.isArray(invites)).toBe(true);
      expect(invites.length).toBe(1);
      expect(invites[0].song.title).toBe('Temps Mort');
      const invitationToken = inviteRes.json().token as string;

      // Booba accepte l'invitation
      const acceptRes = await app.inject({
        method: 'POST',
        url: `/api/invitations/${invitationToken}/accept`,
        cookies: authCookie(booba.sessionId),
      });
      expect(acceptRes.statusCode).toBe(200);

      // 6. Espace partagé et consultation autorisée
      const sharedRes = await app.inject({
        method: 'GET',
        url: '/api/shared/songs',
        cookies: authCookie(booba.sessionId),
      });
      expect(sharedRes.statusCode).toBe(200);
      const sharedSongs = sharedRes.json().items;
      expect(sharedSongs.length).toBe(1);
      expect(sharedSongs[0].title).toBe('Temps Mort');
      expect(sharedSongs[0].role).toBe('CO_AUTHOR');

      // Booba peut maintenant lire le texte
      const songRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}`,
        cookies: authCookie(booba.sessionId),
      });
      expect(songRes.statusCode).toBe(200);
      expect(songRes.json().content).toBe('Dans l’arène…');
    });

    it('Scénario 2 : Commentaires ancrés, réponses et résolution (P1)', async () => {
      const ali = await registerUser('ali2@verso.fr', 'Ali');
      const booba = await registerUser('booba2@verso.fr', 'Booba');

      const song = await prisma.song.create({
        data: { title: 'Temps Mort', content: 'Ligne 1\nLigne 2', userId: ali.userId },
      });

      await prisma.collaborator.create({
        data: {
          songId: song.id,
          userId: booba.userId,
          invitedById: ali.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
      });

      // 1. Dépôt de commentaire par Booba
      const commentRes = await app.inject({
        method: 'POST',
        url: `/api/songs/${song.id}/comments`,
        cookies: authCookie(booba.sessionId),
        payload: {
          content: 'Ajouter plus d’impact sur la rime.',
          startLine: 1,
          endLine: 1,
        },
      });
      expect(commentRes.statusCode).toBe(201);
      const commentId = commentRes.json().comment.id as string;

      // 2. Réponse dans le fil par Ali avec mention
      const replyRes = await app.inject({
        method: 'POST',
        url: `/api/comments/${commentId}/replies`,
        cookies: authCookie(ali.sessionId),
        payload: { content: '@Booba C’est corrigé sur le couplet suivant.' },
      });
      expect(replyRes.statusCode).toBe(201);
      expect(replyRes.json().reply.content).toContain('C’est corrigé');

      // 3. Résolution du commentaire
      const resolveRes = await app.inject({
        method: 'PATCH',
        url: `/api/comments/${commentId}/resolve`,
        cookies: authCookie(ali.sessionId),
      });
      expect(resolveRes.statusCode).toBe(200);
      expect(resolveRes.json().comment.isResolved).toBe(true);

      // Filtre des commentaires ouverts (non résolus)
      const openCommentsRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/comments?isResolved=false`,
        cookies: authCookie(booba.sessionId),
      });
      expect(openCommentsRes.statusCode).toBe(200);
      expect(openCommentsRes.json().comments.length).toBe(0);

      // Tous les commentaires (historique complet)
      const allCommentsRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/comments`,
        cookies: authCookie(booba.sessionId),
      });
      expect(allCommentsRes.statusCode).toBe(200);
      expect(allCommentsRes.json().comments.length).toBe(1);
    });

    it('Scénario 3 : Conflit d’édition asynchrone et zéro perte (P1)', async () => {
      const ali = await registerUser('ali3@verso.fr', 'Ali');
      const booba = await registerUser('booba3@verso.fr', 'Booba');

      const song = await prisma.song.create({
        data: {
          title: 'Titre Concurrence',
          content: 'Version initiale',
          revision: 1,
          userId: ali.userId,
        },
      });

      await prisma.collaborator.create({
        data: {
          songId: song.id,
          userId: booba.userId,
          invitedById: ali.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
      });

      // 1. Ali enregistre sa modification à partir de revision 1
      const editAliRes = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${song.id}`,
        cookies: authCookie(ali.sessionId),
        payload: { content: 'Version d’Ali', expectedRevision: 1 },
      });
      expect(editAliRes.statusCode).toBe(200);
      expect(editAliRes.json().revision).toBe(2);

      // 2. Booba tente d'enregistrer sa propre version concurrente sans avoir rafraîchi (expectedRevision: 1)
      const editBoobaRes = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${song.id}`,
        cookies: authCookie(booba.sessionId),
        payload: { content: 'Version de Booba', expectedRevision: 1 },
      });
      expect(editBoobaRes.statusCode).toBe(409);
      expect(editBoobaRes.json().message).toContain('Conflit');

      // 3. Vérification de la conciliation automatique : zéro perte
      const songInDb = await prisma.song.findUnique({ where: { id: song.id } });
      expect(songInDb?.content).toBe('Version d’Ali');

      // Version conflictuelle archivée en base avec le contenu de Booba
      const conflictVersion = await prisma.songVersion.findFirst({
        where: { songId: song.id, isConflict: true },
      });
      expect(conflictVersion).not.toBeNull();
      expect(conflictVersion?.content).toBe('Version de Booba');
      expect(conflictVersion?.authorId).toBe(booba.userId);
    });

    it('Scénario 4 : Déclaration des crédits et export PDF d’antériorité certifié (P2)', async () => {
      const ali = await registerUser('ali4@verso.fr', 'Ali');

      const song = await prisma.song.create({
        data: { title: 'Temps Mort', content: 'Paroles complètes…', userId: ali.userId },
      });

      // 1. Déclaration des quotes-parts
      const creditsRes = await app.inject({
        method: 'PUT',
        url: `/api/songs/${song.id}/credits`,
        cookies: authCookie(ali.sessionId),
        payload: {
          credits: [
            { name: 'Ali', role: 'AUTHOR', percentage: 50 },
            { name: 'Booba', role: 'AUTHOR', percentage: 50 },
            { name: 'Géraldo', role: 'PRODUCER', percentage: null },
          ],
        },
      });
      expect(creditsRes.statusCode).toBe(200);
      expect(creditsRes.json().totalAuthorPercentage).toBe(100);

      // 2. Export PDF
      const pdfRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/export/pdf`,
        cookies: authCookie(ali.sessionId),
      });
      expect(pdfRes.statusCode).toBe(200);
      expect(pdfRes.headers['content-type']).toBe('application/pdf');
      expect(pdfRes.rawPayload.length).toBeGreaterThan(500);
    });

    it('Scénario 5 : Confidentialité du profil, neutralisation des fuites et blocage mutuel (P2)', async () => {
      const ali = await registerUser('ali5@verso.fr', 'Ali');
      const booba = await registerUser('booba5@verso.fr', 'Booba');

      const song = await prisma.song.create({
        data: { title: 'Titre Commun', content: 'Texte…', userId: ali.userId },
      });

      await prisma.collaborator.create({
        data: {
          songId: song.id,
          userId: booba.userId,
          invitedById: ali.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
      });

      // 1. Recherche par email : zéro fuite d'email dans la réponse (FR-031)
      const searchRes = await app.inject({
        method: 'GET',
        url: '/api/users/search?q=booba5@verso.fr',
        cookies: authCookie(ali.sessionId),
      });
      expect(searchRes.statusCode).toBe(200);
      const searchUsers = searchRes.json().users;
      expect(searchUsers.length).toBe(1);
      expect(searchUsers[0].displayName).toBe('Booba');
      expect(JSON.stringify(searchRes.json())).not.toContain('booba5@verso.fr');

      // 2. Ali bloque Booba
      const blockRes = await app.inject({
        method: 'POST',
        url: `/api/users/${booba.userId}/block`,
        cookies: authCookie(ali.sessionId),
      });
      expect(blockRes.statusCode).toBe(200);

      // 3. Rupture immédiate des accès
      const collabInDb = await prisma.collaborator.findFirst({
        where: { songId: song.id, userId: booba.userId },
      });
      expect(collabInDb?.status).toBe('REVOKED');

      // Booba tente d'accéder au texte -> 404
      const deniedRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}`,
        cookies: authCookie(booba.sessionId),
      });
      expect(deniedRes.statusCode).toBe(404);

      // Booba recherche Ali -> liste vide
      const isolatedSearchRes = await app.inject({
        method: 'GET',
        url: '/api/users/search?q=Ali',
        cookies: authCookie(booba.sessionId),
      });
      expect(isolatedSearchRes.statusCode).toBe(200);
      expect(isolatedSearchRes.json().users.length).toBe(0);
    });
  });
});
