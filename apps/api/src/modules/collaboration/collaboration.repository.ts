import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import type { CollaboratorRole, CollaboratorStatus, InvitationStatus } from '@verso/shared';

export const userSummarySelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
};

export const collaborationRepository = {
  // Invitations
  async createInvitation(data: {
    tokenHash: string;
    role: CollaboratorRole;
    inviterId: string;
    invitedUserId?: string | null;
    invitedEmail?: string | null;
    songId?: string | null;
    albumId?: string | null;
    expiresAt: Date;
  }) {
    return prisma.invitation.create({
      data: {
        tokenHash: data.tokenHash,
        role: data.role,
        inviterId: data.inviterId,
        invitedUserId: data.invitedUserId,
        invitedEmail: data.invitedEmail,
        songId: data.songId,
        albumId: data.albumId,
        expiresAt: data.expiresAt,
        status: 'PENDING',
      },
      include: {
        inviter: { select: userSummarySelect },
        invitedUser: { select: userSummarySelect },
      },
    });
  },

  async findInvitationByTokenHash(tokenHash: string) {
    return prisma.invitation.findUnique({
      where: { tokenHash },
      include: {
        inviter: { select: userSummarySelect },
        invitedUser: { select: userSummarySelect },
        song: { select: { id: true, title: true, userId: true } },
        album: { select: { id: true, title: true, userId: true } },
      },
    });
  },

  async findInvitationById(id: string) {
    return prisma.invitation.findUnique({
      where: { id },
      include: {
        inviter: { select: userSummarySelect },
        invitedUser: { select: userSummarySelect },
      },
    });
  },

  async listPendingInvitationsBySong(songId: string) {
    return prisma.invitation.findMany({
      where: { songId, status: 'PENDING', expiresAt: { gt: new Date() } },
      include: {
        inviter: { select: userSummarySelect },
        invitedUser: { select: userSummarySelect },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async listPendingInvitationsByAlbum(albumId: string) {
    return prisma.invitation.findMany({
      where: { albumId, status: 'PENDING', expiresAt: { gt: new Date() } },
      include: {
        inviter: { select: userSummarySelect },
        invitedUser: { select: userSummarySelect },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async listPendingInvitationsForUser(userId: string, email?: string) {
    return prisma.invitation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { gt: new Date() },
        OR: [{ invitedUserId: userId }, ...(email ? [{ invitedEmail: email }] : [])],
      },
      include: {
        inviter: { select: userSummarySelect },
        song: { select: { id: true, title: true } },
        album: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateInvitationStatus(id: string, status: InvitationStatus, acceptedAt?: Date) {
    return prisma.invitation.update({
      where: { id },
      data: { status, acceptedAt },
    });
  },

  // Collaborators
  async countActiveCollaborators(target: { songId?: string; albumId?: string }) {
    if (target.songId) {
      return prisma.collaborator.count({
        where: { songId: target.songId, status: 'ACTIVE' },
      });
    }
    if (target.albumId) {
      return prisma.collaborator.count({
        where: { albumId: target.albumId, status: 'ACTIVE' },
      });
    }
    return 0;
  },

  async findCollaborator(userId: string, target: { songId?: string; albumId?: string }) {
    if (target.songId) {
      return prisma.collaborator.findUnique({
        where: { unique_user_song_collaborator: { userId, songId: target.songId } },
        include: { user: { select: userSummarySelect } },
      });
    }
    if (target.albumId) {
      return prisma.collaborator.findUnique({
        where: { unique_user_album_collaborator: { userId, albumId: target.albumId } },
        include: { user: { select: userSummarySelect } },
      });
    }
    return null;
  },

  async upsertCollaborator(data: {
    userId: string;
    role: CollaboratorRole;
    invitedById: string;
    songId?: string | null;
    albumId?: string | null;
  }) {
    if (data.songId) {
      return prisma.collaborator.upsert({
        where: {
          unique_user_song_collaborator: {
            userId: data.userId,
            songId: data.songId,
          },
        },
        create: {
          userId: data.userId,
          songId: data.songId,
          role: data.role,
          invitedById: data.invitedById,
          status: 'ACTIVE',
        },
        update: {
          role: data.role,
          status: 'ACTIVE',
          invitedById: data.invitedById,
        },
        include: { user: { select: userSummarySelect } },
      });
    }

    if (data.albumId) {
      return prisma.collaborator.upsert({
        where: {
          unique_user_album_collaborator: {
            userId: data.userId,
            albumId: data.albumId,
          },
        },
        create: {
          userId: data.userId,
          albumId: data.albumId,
          role: data.role,
          invitedById: data.invitedById,
          status: 'ACTIVE',
        },
        update: {
          role: data.role,
          status: 'ACTIVE',
          invitedById: data.invitedById,
        },
        include: { user: { select: userSummarySelect } },
      });
    }

    throw new Error('Cible manquante pour le collaborateur (songId ou albumId requis)');
  },

  async listCollaboratorsBySong(songId: string) {
    return prisma.collaborator.findMany({
      where: { songId, status: 'ACTIVE' },
      include: { user: { select: userSummarySelect } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async listCollaboratorsByAlbum(albumId: string) {
    return prisma.collaborator.findMany({
      where: { albumId, status: 'ACTIVE' },
      include: { user: { select: userSummarySelect } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async updateCollaboratorRole(id: string, role: CollaboratorRole) {
    return prisma.collaborator.update({
      where: { id },
      data: { role },
      include: { user: { select: userSummarySelect } },
    });
  },

  async updateCollaboratorStatus(id: string, status: CollaboratorStatus) {
    return prisma.collaborator.update({
      where: { id },
      data: { status },
      include: { user: { select: userSummarySelect } },
    });
  },

  // Espace "Partagés avec moi"
  async listSharedSongsForUser(userId: string, role?: CollaboratorRole, ownerId?: string) {
    const where: Prisma.CollaboratorWhereInput = {
      status: 'ACTIVE',
      userId,
      songId: { not: null },
      song: {
        isNot: null,
      },
    };

    if (role) {
      where.role = role;
    }

    if (ownerId) {
      where.song = { userId: ownerId };
    }

    return prisma.collaborator.findMany({
      where,
      include: {
        song: {
          include: {
            user: { select: userSummarySelect },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async listSharedAlbumsForUser(userId: string, role?: CollaboratorRole, ownerId?: string) {
    const where: Prisma.CollaboratorWhereInput = {
      status: 'ACTIVE',
      userId,
      albumId: { not: null },
      album: {
        isNot: null,
      },
    };

    if (role) {
      where.role = role;
    }

    if (ownerId) {
      where.album = { userId: ownerId };
    }

    return prisma.collaborator.findMany({
      where,
      include: {
        album: {
          include: {
            user: { select: userSummarySelect },
            _count: { select: { songs: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  // Transfert de propriété automatique (FR-002a)
  async transferOldestCollaboratorOwnership(songId: string) {
    const oldestCoAuthor = await prisma.collaborator.findFirst({
      where: { songId, role: 'CO_AUTHOR', status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });

    if (oldestCoAuthor) {
      await prisma.$transaction([
        prisma.song.update({
          where: { id: songId },
          data: { userId: oldestCoAuthor.userId },
        }),
        prisma.collaborator.delete({
          where: { id: oldestCoAuthor.id },
        }),
      ]);
      return oldestCoAuthor.userId;
    }

    // Aucun co-auteur : supprimer le texte conformément à FR-002a
    await prisma.song.delete({ where: { id: songId } });
    return null;
  },
};
