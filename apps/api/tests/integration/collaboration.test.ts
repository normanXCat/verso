import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

describe("Tests d'intégration : Collaboration et Invitations (/api/songs, /api/albums, /api/invitations)", () => {
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
    await prisma.notification.deleteMany();
    await prisma.abuseReport.deleteMany();
    await prisma.userBlock.deleteMany();
    await prisma.songCredit.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.collaborator.deleteMany();
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

  async function registerUser(
    email: string,
    displayName?: string,
  ): Promise<{ userId: string; sessionId: string; email: string; displayName?: string }> {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'Password123!', displayName },
    });
    const sessionId = response.cookies.find((c) => c.name === 'session_id')?.value;
    if (!sessionId) {
      throw new Error("Échec de l'obtention du cookie de session");
    }
    return {
      userId: response.json().user.id as string,
      sessionId,
      email,
      displayName,
    };
  }

  function authCookie(sessionId: string): { session_id: string } {
    return { session_id: sessionId };
  }

  describe('Cycle d’invitation sur un texte (Song)', () => {
    it('permet au propriétaire d’inviter un collaborateur par email avec token haché', async () => {
      const owner = await registerUser('collab-owner@verso.fr', 'MC Owner');
      const invitee = await registerUser('collab-guest@verso.fr', 'MC Guest');

      // Créer un morceau
      const songRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Feat de Légende', content: 'Premier couplet' },
      });
      const songId = songRes.json().id;

      // Inviter par email
      const inviteRes = await app.inject({
        method: 'POST',
        url: `/api/songs/${songId}/invitations`,
        cookies: authCookie(owner.sessionId),
        payload: {
          recipient: invitee.email,
          role: 'CO_AUTHOR',
          expiresInDays: 7,
        },
      });

      expect(inviteRes.statusCode).toBe(201);
      const inviteData = inviteRes.json();
      expect(inviteData.token).toBeDefined();
      expect(inviteData.token).toMatch(/^sec_/);
      expect(inviteData.role).toBe('CO_AUTHOR');
      expect(inviteData.status).toBe('PENDING');

      // Vérifier que le token n'est PAS stocké en clair en BDD (hachage SHA-256)
      const expectedHash = crypto.createHash('sha256').update(inviteData.token).digest('hex');
      const savedInvitation = await prisma.invitation.findUnique({
        where: { id: inviteData.id },
      });
      expect(savedInvitation).not.toBeNull();
      expect(savedInvitation?.tokenHash).toBe(expectedHash);
      expect(savedInvitation?.tokenHash).not.toBe(inviteData.token);

      // Vérifier l'émission de la notification in-app
      const notif = await prisma.notification.findFirst({
        where: { recipientId: invitee.userId, type: 'INVITATION_RECEIVED' },
      });
      expect(notif).not.toBeNull();
      expect(notif?.songId).toBe(songId);
    });

    it('permet d’inviter par nom d’artiste (displayName)', async () => {
      const owner = await registerUser('owner2@verso.fr', 'Alpha');
      const _invitee = await registerUser('guest2@verso.fr', 'BetaBeatmaker');

      const songRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Titre Solo' },
      });
      const songId = songRes.json().id;

      const inviteRes = await app.inject({
        method: 'POST',
        url: `/api/songs/${songId}/invitations`,
        cookies: authCookie(owner.sessionId),
        payload: {
          recipient: 'BetaBeatmaker',
          role: 'COMMENTER',
        },
      });

      expect(inviteRes.statusCode).toBe(201);
      expect(inviteRes.json().role).toBe('COMMENTER');
    });

    it('refuse l’accès avec 404 neutre si un non-propriétaire tente d’inviter', async () => {
      const owner = await registerUser('owner3@verso.fr', 'VraiProprio');
      const stranger = await registerUser('stranger@verso.fr', 'Inconnu');

      const songRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Confidentiel' },
      });
      const songId = songRes.json().id;

      const res = await app.inject({
        method: 'POST',
        url: `/api/songs/${songId}/invitations`,
        cookies: authCookie(stranger.sessionId),
        payload: {
          recipient: 'someone@verso.fr',
          role: 'READER',
        },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().message).toBe('Ressource introuvable');
    });

    it('interdit de s’inviter soi-même', async () => {
      const owner = await registerUser('self-invite@verso.fr', 'Narcisse');

      const songRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Miroir' },
      });
      const songId = songRes.json().id;

      const res = await app.inject({
        method: 'POST',
        url: `/api/songs/${songId}/invitations`,
        cookies: authCookie(owner.sessionId),
        payload: {
          recipient: owner.email,
          role: 'CO_AUTHOR',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().message).toContain('vous inviter vous-même');
    });

    it('respecte le quota strict de 10 collaborateurs actifs par texte (FR-008a)', async () => {
      const owner = await registerUser('quota-owner@verso.fr', 'Chef Orchestre');

      const songRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Texte Collectif' },
      });
      const songId = songRes.json().id;

      // Créer 10 collaborateurs actifs
      for (let i = 0; i < 10; i++) {
        const u = await registerUser(`collab-${i}@verso.fr`, `Artiste ${i}`);
        await prisma.collaborator.create({
          data: {
            songId,
            userId: u.userId,
            invitedById: owner.userId,
            role: 'CO_AUTHOR',
            status: 'ACTIVE',
          },
        });
      }

      // Tentative de 11e invitation
      const res = await app.inject({
        method: 'POST',
        url: `/api/songs/${songId}/invitations`,
        cookies: authCookie(owner.sessionId),
        payload: {
          recipient: 'trop-tard@verso.fr',
          role: 'READER',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().message).toContain('Limite maximale atteinte');
    });
  });

  describe('Acceptation, refus et révocation d’invitation', () => {
    it('accepte une invitation avec succès et donne accès au texte', async () => {
      const owner = await registerUser('accept-owner@verso.fr', 'Owner Alpha');
      const guest = await registerUser('accept-guest@verso.fr', 'Guest Bravo');

      const songRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Chanson à deux', content: 'Couplet 1' },
      });
      const songId = songRes.json().id;

      // Émission de l'invitation
      const inviteRes = await app.inject({
        method: 'POST',
        url: `/api/songs/${songId}/invitations`,
        cookies: authCookie(owner.sessionId),
        payload: { recipient: guest.email, role: 'CO_AUTHOR' },
      });
      const token = inviteRes.json().token;

      // L'invité accepte
      const acceptRes = await app.inject({
        method: 'POST',
        url: `/api/invitations/${token}/accept`,
        cookies: authCookie(guest.sessionId),
      });

      expect(acceptRes.statusCode).toBe(200);
      expect(acceptRes.json().message).toBe('Invitation acceptée');

      // Le co-auteur peut désormais lire le texte
      const readSongRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}`,
        cookies: authCookie(guest.sessionId),
      });
      expect(readSongRes.statusCode).toBe(200);
      expect(readSongRes.json().title).toBe('Chanson à deux');

      // Rejouer l'invitation déjà acceptée renvoie 404
      const replayRes = await app.inject({
        method: 'POST',
        url: `/api/invitations/${token}/accept`,
        cookies: authCookie(guest.sessionId),
      });
      expect(replayRes.statusCode).toBe(404);
    });

    it('refuse une invitation et empêche l’accès', async () => {
      const owner = await registerUser('decline-owner@verso.fr', 'Owner Solo');
      const guest = await registerUser('decline-guest@verso.fr', 'Guest Refus');

      const songRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Proposition Refusée' },
      });
      const songId = songRes.json().id;

      const inviteRes = await app.inject({
        method: 'POST',
        url: `/api/songs/${songId}/invitations`,
        cookies: authCookie(owner.sessionId),
        payload: { recipient: guest.email, role: 'COMMENTER' },
      });
      const token = inviteRes.json().token;

      // Refus
      const declineRes = await app.inject({
        method: 'POST',
        url: `/api/invitations/${token}/decline`,
        cookies: authCookie(guest.sessionId),
      });

      expect(declineRes.statusCode).toBe(200);

      // Le texte n'est pas accessible au guest -> 404
      const readRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}`,
        cookies: authCookie(guest.sessionId),
      });
      expect(readRes.statusCode).toBe(404);
    });

    it('interdit l’acceptation d’une invitation nominative par un tiers', async () => {
      const owner = await registerUser('third-owner@verso.fr', 'Owner 3');
      const targetUser = await registerUser('target@verso.fr', 'Destinataire');
      const interceptor = await registerUser('hacker@verso.fr', 'Intercepteur');

      const songRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Privé' },
      });
      const songId = songRes.json().id;

      const inviteRes = await app.inject({
        method: 'POST',
        url: `/api/songs/${songId}/invitations`,
        cookies: authCookie(owner.sessionId),
        payload: { recipient: targetUser.email, role: 'CO_AUTHOR' },
      });
      const token = inviteRes.json().token;

      // L'intercepteur essaie d'accepter
      const acceptRes = await app.inject({
        method: 'POST',
        url: `/api/invitations/${token}/accept`,
        cookies: authCookie(interceptor.sessionId),
      });

      expect(acceptRes.statusCode).toBe(404);
    });
  });

  describe('Gestion des collaborateurs (liste, changement de rôle, révocation, départ)', () => {
    it('permet au propriétaire de modifier le rôle d’un collaborateur et de le révoquer', async () => {
      const owner = await registerUser('manage-owner@verso.fr', 'Patron');
      const guest = await registerUser('manage-guest@verso.fr', 'Participant');

      const songRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Gestion Accès' },
      });
      const songId = songRes.json().id;

      // Création directe d'un collaborateur actif
      await prisma.collaborator.create({
        data: {
          songId,
          userId: guest.userId,
          invitedById: owner.userId,
          role: 'READER',
          status: 'ACTIVE',
        },
      });

      // 1. Lister les collaborateurs
      const listRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}/collaborators`,
        cookies: authCookie(owner.sessionId),
      });
      expect(listRes.statusCode).toBe(200);
      expect(listRes.json().collaborators).toHaveLength(1);
      expect(listRes.json().collaborators[0].role).toBe('READER');

      // 2. Promotion en CO_AUTHOR
      const patchRes = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${songId}/collaborators/${guest.userId}`,
        cookies: authCookie(owner.sessionId),
        payload: { role: 'CO_AUTHOR' },
      });
      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.json().role).toBe('CO_AUTHOR');

      // 3. Révocation
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/api/songs/${songId}/collaborators/${guest.userId}`,
        cookies: authCookie(owner.sessionId),
      });
      expect(deleteRes.statusCode).toBe(200);

      // 4. L'accès révoqué renvoie 404 immédiat (FR-004)
      const readRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}`,
        cookies: authCookie(guest.sessionId),
      });
      expect(readRes.statusCode).toBe(404);
    });

    it('permet à un collaborateur de quitter volontairement un projet (FR-005)', async () => {
      const owner = await registerUser('leave-owner@verso.fr', 'Proprio');
      const guest = await registerUser('leave-guest@verso.fr', 'Démissionnaire');

      const songRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Projet Collaboratif' },
      });
      const songId = songRes.json().id;

      await prisma.collaborator.create({
        data: {
          songId,
          userId: guest.userId,
          invitedById: owner.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
      });

      // Quitter
      const leaveRes = await app.inject({
        method: 'DELETE',
        url: `/api/collaborations/song/${songId}/leave`,
        cookies: authCookie(guest.sessionId),
      });

      expect(leaveRes.statusCode).toBe(200);
      expect(leaveRes.json().message).toContain('quitté le projet');

      // Ne peut plus accéder
      const readRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}`,
        cookies: authCookie(guest.sessionId),
      });
      expect(readRes.statusCode).toBe(404);
    });
  });

  describe('Cascade de collaboration sur Album (FR-010)', () => {
    it('donne accès aux textes de l’album aux collaborateurs de l’album', async () => {
      const owner = await registerUser('album-owner@verso.fr', 'Producteur Album');
      const coauthor = await registerUser('album-collab@verso.fr', 'Co-auteur Album');

      // 1. Créer un album
      const albumRes = await app.inject({
        method: 'POST',
        url: '/api/albums',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Double Album' },
      });
      const albumId = albumRes.json().id;

      // 2. Créer un morceau et le rattacher à l'album
      const songRes = await app.inject({
        method: 'POST',
        url: '/api/songs',
        cookies: authCookie(owner.sessionId),
        payload: { title: 'Track 1', albumId },
      });
      const songId = songRes.json().id;

      // 3. Inviter sur l'album
      const inviteRes = await app.inject({
        method: 'POST',
        url: `/api/albums/${albumId}/invitations`,
        cookies: authCookie(owner.sessionId),
        payload: { recipient: coauthor.email, role: 'CO_AUTHOR' },
      });
      expect(inviteRes.statusCode).toBe(201);
      const token = inviteRes.json().token;

      // 4. Accepter
      await app.inject({
        method: 'POST',
        url: `/api/invitations/${token}/accept`,
        cookies: authCookie(coauthor.sessionId),
      });

      // 5. Le co-auteur de l'album peut lire et mettre à jour le morceau rattaché (FR-010)
      const readSongRes = await app.inject({
        method: 'GET',
        url: `/api/songs/${songId}`,
        cookies: authCookie(coauthor.sessionId),
      });
      expect(readSongRes.statusCode).toBe(200);

      const updateSongRes = await app.inject({
        method: 'PATCH',
        url: `/api/songs/${songId}`,
        cookies: authCookie(coauthor.sessionId),
        payload: { content: 'Paroles rédigées par le co-auteur album' },
      });
      expect(updateSongRes.statusCode).toBe(200);
    });
  });
});
