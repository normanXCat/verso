import { prisma } from '../../config/prisma.js';
import { NotFoundAccessError, evaluateSongAction } from '../permissions/permissions.service.js';
import type { CreateAbuseReportInput, SongActivityItem, UpdateProfileInput } from '@verso/shared';

export class ModerationServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ModerationServiceError';
    this.statusCode = statusCode;
  }
}

export const moderationService = {
  /**
   * Recherche d'utilisateurs anti-énumération (FR-030, FR-031, FR-038)
   * ZÉRO email divulgué dans les résultats.
   * Exclusion réciproque des utilisateurs bloqués.
   */
  async searchUsers(currentUserId: string, query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      return { users: [] };
    }

    // Récupérer les utilisateurs bloqués dans un sens ou dans l'autre
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
      },
      select: { blockerId: true, blockedId: true },
    });

    const excludedIds = new Set<string>([currentUserId]);
    for (const b of blocks) {
      excludedIds.add(b.blockerId === currentUserId ? b.blockedId : b.blockerId);
    }

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludedIds) },
        OR: [
          { displayName: { contains: trimmed, mode: 'insensitive' } },
          { email: { equals: trimmed.toLowerCase() } },
        ],
      },
      take: 10,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    return { users };
  },

  /**
   * Consultation de profil minimal (FR-030, FR-031)
   * ZÉRO divulgation d'email.
   * 404 (zéro fuite) si l'utilisateur est bloqué bilatéralement.
   */
  async getUserProfile(currentUserId: string, targetUserId: string) {
    // Vérifier blocage mutuel
    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: currentUserId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: currentUserId },
        ],
      },
    });

    if (isBlocked) {
      throw new NotFoundAccessError('Utilisateur introuvable');
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundAccessError('Utilisateur introuvable');
    }

    return user;
  },

  /**
   * Mise à jour de son profil (bio max 280 car, displayName, avatar)
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    if (input.bio && input.bio.length > 280) {
      throw new ModerationServiceError('La biographie ne peut pas dépasser 280 caractères', 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName?.trim() || undefined,
        avatarUrl: input.avatarUrl,
        bio: input.bio?.trim() || null,
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    return updated;
  },

  /**
   * Bloquer un utilisateur avec rupture bilatérale immédiate (FR-032)
   */
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new ModerationServiceError('Impossible de se bloquer soi-même', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: blockedId },
    });
    if (!targetUser) {
      throw new NotFoundAccessError('Utilisateur introuvable');
    }

    await prisma.$transaction(async (tx) => {
      // 1. Création du blocage
      await tx.userBlock.upsert({
        where: {
          unique_user_block: {
            blockerId,
            blockedId,
          },
        },
        create: {
          blockerId,
          blockedId,
        },
        update: {},
      });

      // 2. Rupture bilatérale immédiate sur les œuvres du bloqueur (accès révoqué)
      const blockerSongs = await tx.song.findMany({
        where: { userId: blockerId },
        select: { id: true },
      });
      if (blockerSongs.length > 0) {
        await tx.collaborator.updateMany({
          where: {
            songId: { in: blockerSongs.map((s) => s.id) },
            userId: blockedId,
          },
          data: { status: 'REVOKED' },
        });
      }

      const blockerAlbums = await tx.album.findMany({
        where: { userId: blockerId },
        select: { id: true },
      });
      if (blockerAlbums.length > 0) {
        await tx.collaborator.updateMany({
          where: {
            albumId: { in: blockerAlbums.map((a) => a.id) },
            userId: blockedId,
          },
          data: { status: 'REVOKED' },
        });
      }

      // 3. Rupture bilatérale immédiate sur les œuvres du bloqué (bloqueur retiré / LEFT)
      const blockedSongs = await tx.song.findMany({
        where: { userId: blockedId },
        select: { id: true },
      });
      if (blockedSongs.length > 0) {
        await tx.collaborator.updateMany({
          where: {
            songId: { in: blockedSongs.map((s) => s.id) },
            userId: blockerId,
          },
          data: { status: 'LEFT' },
        });
      }

      const blockedAlbums = await tx.album.findMany({
        where: { userId: blockedId },
        select: { id: true },
      });
      if (blockedAlbums.length > 0) {
        await tx.collaborator.updateMany({
          where: {
            albumId: { in: blockedAlbums.map((a) => a.id) },
            userId: blockerId,
          },
          data: { status: 'LEFT' },
        });
      }

      // 4. Révocation des invitations en cours entre les deux utilisateurs
      await tx.invitation.updateMany({
        where: {
          status: 'PENDING',
          OR: [
            { inviterId: blockerId, invitedUserId: blockedId },
            { inviterId: blockedId, invitedUserId: blockerId },
          ],
        },
        data: { status: 'REVOKED' },
      });
    });

    return { message: 'Utilisateur bloqué avec succès' };
  },

  /**
   * Débloquer un utilisateur
   */
  async unblockUser(blockerId: string, blockedId: string) {
    await prisma.userBlock.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });

    return { message: 'Utilisateur débloqué avec succès' };
  },

  /**
   * Liste des utilisateurs bloqués
   */
  async getBlockedUsers(currentUserId: string) {
    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: currentUserId },
      include: {
        blocked: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      blockedUsers: blocks.map((b) => ({
        id: b.blocked.id,
        displayName: b.blocked.displayName,
        avatarUrl: b.blocked.avatarUrl,
        blockedAt: b.createdAt,
      })),
    };
  },

  /**
   * Signalement de contenu ou comportement abusif (FR-033)
   */
  async createReport(reporterId: string, input: CreateAbuseReportInput) {
    const report = await prisma.abuseReport.create({
      data: {
        reporterId,
        reason: input.reason,
        details: input.details?.trim() || null,
        reportedUserId: input.reportedUserId,
        songId: input.songId,
        commentId: input.commentId,
        status: 'PENDING',
      },
    });

    return {
      message: 'Signalement transmis à l’équipe de modération',
      id: report.id,
    };
  },

  /**
   * Journal chronologique d'activité récente d'un texte (FR-034)
   */
  async getSongActivity(currentUserId: string, songId: string) {
    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: {
        collaborators: true,
        album: {
          include: {
            collaborators: true,
          },
        },
      },
    });

    if (!song) {
      throw new NotFoundAccessError('Ressource introuvable');
    }

    const hasAccess = evaluateSongAction(currentUserId, song, 'read');
    if (!hasAccess) {
      throw new NotFoundAccessError('Ressource introuvable');
    }

    // Récupérer les identifiants d'utilisateurs bloqués bilatéralement
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const blockedUserIds = new Set<string>();
    for (const b of blocks) {
      blockedUserIds.add(b.blockerId === currentUserId ? b.blockedId : b.blockerId);
    }

    const activities: SongActivityItem[] = [];

    // 1. Versions
    const versions = await prisma.songVersion.findMany({
      where: { songId },
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    for (const v of versions) {
      if (v.author && blockedUserIds.has(v.author.id)) continue;
      const actor = v.author || {
        id: song.userId,
        displayName: 'Auteur',
        avatarUrl: null,
      };

      const isRestore = v.title?.toLowerCase().includes('restauration') || false;
      activities.push({
        id: `version-${v.id}`,
        action: isRestore ? 'restore' : 'edit',
        details: v.title || 'Révision textuelle',
        actor,
        timestamp: v.createdAt,
      });
    }

    // 2. Commentaires
    const comments = await prisma.comment.findMany({
      where: { songId },
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    for (const c of comments) {
      if (blockedUserIds.has(c.author.id)) continue;
      activities.push({
        id: `comment-${c.id}`,
        action: c.isResolved ? 'resolve' : 'comment',
        details: c.isResolved
          ? `Discussion résolue (lignes ${c.startLine}-${c.endLine})`
          : `Commentaire ajouté (lignes ${c.startLine}-${c.endLine})`,
        actor: c.author,
        timestamp: c.createdAt,
      });
    }

    // 3. Collaborations
    const collabs = await prisma.collaborator.findMany({
      where: { songId },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const col of collabs) {
      if (blockedUserIds.has(col.user.id)) continue;
      activities.push({
        id: `collab-${col.id}`,
        action: col.status === 'LEFT' ? 'leave' : 'invite',
        details: col.status === 'LEFT' ? 'A quitté le projet' : `A rejoint le projet (${col.role})`,
        actor: col.user,
        timestamp: col.createdAt,
      });
    }

    // Tri chronologique descendant
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { activities: activities.slice(0, 30) };
  },
};
