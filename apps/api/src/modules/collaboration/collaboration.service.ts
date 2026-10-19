import crypto from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { assertCan, NotFoundAccessError } from '../permissions/permissions.service.js';
import type { ResourceTarget } from '../permissions/permissions.types.js';
import { collaborationRepository, userSummarySelect } from './collaboration.repository.js';
import { notificationsService } from '../notifications/notifications.service.js';
import {
  MAX_ACTIVE_COLLABORATORS_PER_SONG,
  type CollaboratorRole,
  type CreateInvitationInput,
  type SharedWithMeQuery,
} from '@verso/shared';

export class CollaborationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'CollaborationError';
    this.statusCode = statusCode;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateInvitationToken(): string {
  return `sec_${crypto.randomBytes(32).toString('base64url')}`;
}

export const collaborationService = {
  /**
   * Inviter un collaborateur sur un texte (par username ou email)
   */
  async inviteToSong(inviter: { id: string }, songId: string, input: CreateInvitationInput) {
    await assertCan(inviter, { type: 'song', id: songId }, 'manage_collaborators');

    // Vérification du quota strict (FR-008a)
    const activeCount = await collaborationRepository.countActiveCollaborators({ songId });
    if (activeCount >= MAX_ACTIVE_COLLABORATORS_PER_SONG) {
      throw new CollaborationError(
        `Limite maximale atteinte (${MAX_ACTIVE_COLLABORATORS_PER_SONG} collaborateurs actifs par texte)`,
      );
    }

    const recipientInput = input.recipient.trim();
    const isEmail = recipientInput.includes('@');

    // Résolution du destinataire (par email ou nom d'artiste / pseudonyme)
    const targetUser = await prisma.user.findFirst({
      where: isEmail
        ? { email: { equals: recipientInput, mode: 'insensitive' } }
        : { displayName: { equals: recipientInput, mode: 'insensitive' } },
      select: userSummarySelect,
    });

    if (targetUser) {
      if (targetUser.id === inviter.id) {
        throw new CollaborationError('Vous ne pouvez pas vous inviter vous-même');
      }

      // Vérification blocage mutuel (FR-032)
      const isBlocked = await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: inviter.id, blockedId: targetUser.id },
            { blockerId: targetUser.id, blockedId: inviter.id },
          ],
        },
      });

      if (isBlocked) {
        throw new CollaborationError('Impossible d’envoyer une invitation à cet utilisateur');
      }

      // Vérification collaborateur existant
      const existingCollab = await collaborationRepository.findCollaborator(targetUser.id, {
        songId,
      });
      if (existingCollab && existingCollab.status === 'ACTIVE') {
        throw new CollaborationError('Cet utilisateur collabore déjà sur ce texte');
      }
    } else if (!isEmail) {
      throw new NotFoundAccessError('Utilisateur introuvable');
    }

    const rawToken = generateInvitationToken();
    const tokenHash = hashToken(rawToken);
    const expiresInDays = input.expiresInDays || 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invitation = await collaborationRepository.createInvitation({
      tokenHash,
      role: input.role,
      inviterId: inviter.id,
      invitedUserId: targetUser?.id,
      invitedEmail: !targetUser && isEmail ? recipientInput.toLowerCase() : null,
      songId,
      expiresAt,
    });

    // Envoi d'une notification si utilisateur existant
    if (targetUser) {
      await notificationsService.sendNotification({
        type: 'INVITATION_RECEIVED',
        recipientId: targetUser.id,
        actorId: inviter.id,
        songId,
        invitationId: invitation.id,
      });
    }

    return {
      id: invitation.id,
      token: rawToken,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      invitedUser: invitation.invitedUser,
      invitedEmail: invitation.invitedEmail,
    };
  },

  /**
   * Inviter un collaborateur sur un album
   */
  async inviteToAlbum(inviter: { id: string }, albumId: string, input: CreateInvitationInput) {
    await assertCan(inviter, { type: 'album', id: albumId }, 'manage_collaborators');

    const recipientInput = input.recipient.trim();
    const isEmail = recipientInput.includes('@');

    const targetUser = await prisma.user.findFirst({
      where: isEmail
        ? { email: { equals: recipientInput, mode: 'insensitive' } }
        : { displayName: { equals: recipientInput, mode: 'insensitive' } },
      select: userSummarySelect,
    });

    if (targetUser) {
      if (targetUser.id === inviter.id) {
        throw new CollaborationError('Vous ne pouvez pas vous inviter vous-même');
      }

      const existingCollab = await collaborationRepository.findCollaborator(targetUser.id, {
        albumId,
      });
      if (existingCollab && existingCollab.status === 'ACTIVE') {
        throw new CollaborationError('Cet utilisateur collabore déjà sur cet album');
      }
    } else if (!isEmail) {
      throw new NotFoundAccessError('Utilisateur introuvable');
    }

    const rawToken = generateInvitationToken();
    const tokenHash = hashToken(rawToken);
    const expiresInDays = input.expiresInDays || 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invitation = await collaborationRepository.createInvitation({
      tokenHash,
      role: input.role,
      inviterId: inviter.id,
      invitedUserId: targetUser?.id,
      invitedEmail: !targetUser && isEmail ? recipientInput.toLowerCase() : null,
      albumId,
      expiresAt,
    });

    if (targetUser) {
      await notificationsService.sendNotification({
        type: 'INVITATION_RECEIVED',
        recipientId: targetUser.id,
        actorId: inviter.id,
        albumId,
        invitationId: invitation.id,
      });
    }

    return {
      id: invitation.id,
      token: rawToken,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      invitedUser: invitation.invitedUser,
      invitedEmail: invitation.invitedEmail,
    };
  },

  /**
   * Lister les collaborateurs d'un texte et ses invitations en attente
   */
  async getSongCollaborators(user: { id: string }, songId: string) {
    await assertCan(user, { type: 'song', id: songId }, 'read');

    const song = await prisma.song.findUnique({
      where: { id: songId },
      select: { userId: true },
    });
    if (!song) throw new NotFoundAccessError();

    const isOwner = song.userId === user.id;
    const collaborators = await collaborationRepository.listCollaboratorsBySong(songId);
    const pendingInvitations = isOwner
      ? await collaborationRepository.listPendingInvitationsBySong(songId)
      : [];

    return {
      collaborators,
      pendingInvitations,
    };
  },

  /**
   * Lister les collaborateurs d'un album
   */
  async getAlbumCollaborators(user: { id: string }, albumId: string) {
    await assertCan(user, { type: 'album', id: albumId }, 'read');

    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: { userId: true },
    });
    if (!album) throw new NotFoundAccessError();

    const isOwner = album.userId === user.id;
    const collaborators = await collaborationRepository.listCollaboratorsByAlbum(albumId);
    const pendingInvitations = isOwner
      ? await collaborationRepository.listPendingInvitationsByAlbum(albumId)
      : [];

    return {
      collaborators,
      pendingInvitations,
    };
  },

  /**
   * Mettre à jour le rôle d'un collaborateur
   */
  async updateCollaboratorRole(
    user: { id: string },
    target: { songId?: string; albumId?: string },
    targetUserId: string,
    role: CollaboratorRole,
  ) {
    if (target.songId) {
      await assertCan(user, { type: 'song', id: target.songId }, 'manage_collaborators');
    } else if (target.albumId) {
      await assertCan(user, { type: 'album', id: target.albumId }, 'manage_collaborators');
    }

    const collab = await collaborationRepository.findCollaborator(targetUserId, target);
    if (!collab || collab.status !== 'ACTIVE') {
      throw new NotFoundAccessError('Collaborateur introuvable');
    }

    return collaborationRepository.updateCollaboratorRole(collab.id, role);
  },

  /**
   * Révoquer l'accès d'un collaborateur
   */
  async revokeCollaborator(
    user: { id: string },
    target: { songId?: string; albumId?: string },
    targetUserId: string,
  ) {
    if (target.songId) {
      await assertCan(user, { type: 'song', id: target.songId }, 'manage_collaborators');
    } else if (target.albumId) {
      await assertCan(user, { type: 'album', id: target.albumId }, 'manage_collaborators');
    }

    const collab = await collaborationRepository.findCollaborator(targetUserId, target);
    if (!collab || collab.status !== 'ACTIVE') {
      throw new NotFoundAccessError('Collaborateur introuvable');
    }

    return collaborationRepository.updateCollaboratorStatus(collab.id, 'REVOKED');
  },

  /**
   * Accepter une invitation par jeton
   */
  async acceptInvitation(user: { id: string; email: string }, token: string) {
    const tokenHash = hashToken(token);
    const invitation = await collaborationRepository.findInvitationByTokenHash(tokenHash);

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      throw new NotFoundAccessError("Ce lien d'invitation est invalide ou a expiré");
    }

    // Contrôle d'assignation explicite
    if (invitation.invitedUserId && invitation.invitedUserId !== user.id) {
      throw new NotFoundAccessError("Ce lien d'invitation ne vous est pas destiné");
    }

    if (
      invitation.invitedEmail &&
      invitation.invitedEmail.toLowerCase() !== user.email.toLowerCase()
    ) {
      throw new NotFoundAccessError("Ce lien d'invitation ne vous est pas destiné");
    }

    // Quota check si invitation sur morceau
    if (invitation.songId) {
      const count = await collaborationRepository.countActiveCollaborators({
        songId: invitation.songId,
      });
      if (count >= MAX_ACTIVE_COLLABORATORS_PER_SONG) {
        throw new CollaborationError(
          `Le texte a déjà atteint son quota maximal de ${MAX_ACTIVE_COLLABORATORS_PER_SONG} collaborateurs`,
        );
      }
    }

    await collaborationRepository.updateInvitationStatus(invitation.id, 'ACCEPTED', new Date());

    const collaborator = await collaborationRepository.upsertCollaborator({
      userId: user.id,
      role: invitation.role,
      invitedById: invitation.inviterId,
      songId: invitation.songId,
      albumId: invitation.albumId,
    });

    // Notification à l'inviteur
    await notificationsService.sendNotification({
      type: 'INVITATION_ACCEPTED',
      recipientId: invitation.inviterId,
      actorId: user.id,
      songId: invitation.songId,
      albumId: invitation.albumId,
      invitationId: invitation.id,
    });

    return {
      message: 'Invitation acceptée',
      collaborator,
      songId: invitation.songId,
      albumId: invitation.albumId,
    };
  },

  /**
   * Refuser une invitation par jeton
   */
  async declineInvitation(user: { id: string; email: string }, token: string) {
    const tokenHash = hashToken(token);
    const invitation = await collaborationRepository.findInvitationByTokenHash(tokenHash);

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      throw new NotFoundAccessError("Ce lien d'invitation est invalide ou a expiré");
    }

    if (invitation.invitedUserId && invitation.invitedUserId !== user.id) {
      throw new NotFoundAccessError("Ce lien d'invitation ne vous est pas destiné");
    }

    if (
      invitation.invitedEmail &&
      invitation.invitedEmail.toLowerCase() !== user.email.toLowerCase()
    ) {
      throw new NotFoundAccessError("Ce lien d'invitation ne vous est pas destiné");
    }

    await collaborationRepository.updateInvitationStatus(invitation.id, 'DECLINED');

    // Notification à l'inviteur
    await notificationsService.sendNotification({
      type: 'INVITATION_DECLINED',
      recipientId: invitation.inviterId,
      actorId: user.id,
      songId: invitation.songId,
      albumId: invitation.albumId,
      invitationId: invitation.id,
    });

    return { message: 'Invitation refusée' };
  },

  /**
   * Quitter volontairement une œuvre partagée (FR-005 & FR-005a)
   */
  async leaveCollaboration(
    user: { id: string },
    resourceType: 'song' | 'album',
    resourceId: string,
  ) {
    const target = resourceType === 'song' ? { songId: resourceId } : { albumId: resourceId };

    const collab = await collaborationRepository.findCollaborator(user.id, target);
    if (!collab || collab.status !== 'ACTIVE') {
      throw new NotFoundAccessError('Collaboration introuvable');
    }

    await assertCan(user, { type: resourceType, id: resourceId } as ResourceTarget, 'leave');

    await collaborationRepository.updateCollaboratorStatus(collab.id, 'LEFT');

    // Anonymisation des commentaires passés de l'auteur sur ce morceau (FR-005a)
    if (resourceType === 'song') {
      await prisma.comment.updateMany({
        where: { songId: resourceId, authorId: user.id },
        data: { isAnonymized: true },
      });
    }

    return { message: 'Vous avez quitté le projet avec succès' };
  },

  /**
   * Consulter les œuvres partagées ("Partagés avec moi" - US2)
   */
  async getSharedWithMe(user: { id: string }, query: SharedWithMeQuery) {
    const results: Array<{
      id: string;
      type: 'song' | 'album';
      title: string;
      role: CollaboratorRole;
      owner: { id: string; displayName: string | null; avatarUrl: string | null };
      updatedAt: Date;
      trackCount?: number;
    }> = [];

    if (query.type === 'song' || query.type === 'all') {
      const sharedSongs = await collaborationRepository.listSharedSongsForUser(
        user.id,
        query.role,
        query.ownerId,
      );

      for (const item of sharedSongs) {
        if (item.song) {
          results.push({
            id: item.song.id,
            type: 'song',
            title: item.song.title,
            role: item.role,
            owner: item.song.user,
            updatedAt: item.song.updatedAt,
          });
        }
      }
    }

    if (query.type === 'album' || query.type === 'all') {
      const sharedAlbums = await collaborationRepository.listSharedAlbumsForUser(
        user.id,
        query.role,
        query.ownerId,
      );

      for (const item of sharedAlbums) {
        if (item.album) {
          results.push({
            id: item.album.id,
            type: 'album',
            title: item.album.title,
            role: item.role,
            owner: item.album.user,
            updatedAt: item.album.updatedAt,
            trackCount: item.album._count?.songs ?? 0,
          });
        }
      }
    }

    results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return { items: results };
  },

  /**
   * Lister les invitations reçues en attente pour l'utilisateur connecté
   */
  async getUserInvitations(user: { id: string; email: string }) {
    return collaborationRepository.listPendingInvitationsForUser(user.id, user.email);
  },
};
