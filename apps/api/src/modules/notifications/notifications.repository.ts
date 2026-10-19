import { prisma } from '../../config/prisma.js';
import type {
  NotificationType,
  NotificationSettings,
  UpdateNotificationSettingsInput,
  NotificationItem,
  NotificationTarget,
} from '@verso/shared';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  inApp: {
    invitations: true,
    comments: true,
    mentions: true,
  },
  email: {
    invitations: true,
    comments: false,
    mentions: true,
  },
};

const userSettingsStore = new Map<string, NotificationSettings>();

export interface CreateNotificationData {
  type: NotificationType;
  recipientId: string;
  actorId?: string | null;
  songId?: string | null;
  albumId?: string | null;
  commentId?: string | null;
  invitationId?: string | null;
}

export const notificationsRepository = {
  /**
   * Créer une notification en base
   */
  async createNotification(data: CreateNotificationData) {
    return prisma.notification.create({
      data: {
        type: data.type,
        recipientId: data.recipientId,
        actorId: data.actorId ?? null,
        songId: data.songId ?? null,
        albumId: data.albumId ?? null,
        commentId: data.commentId ?? null,
        invitationId: data.invitationId ?? null,
      },
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  /**
   * Trouver une notification par son identifiant
   */
  async findNotificationById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  /**
   * Compter les notifications non lues d'un utilisateur
   */
  async countUnread(recipientId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        recipientId,
        isRead: false,
      },
    });
  },

  /**
   * Lister les notifications d'un utilisateur avec enrichissement de cible
   */
  async listNotificationsByRecipient(
    recipientId: string,
    options: { unreadOnly?: boolean; limit?: number } = {},
  ): Promise<NotificationItem[]> {
    const rawNotifications = await prisma.notification.findMany({
      where: {
        recipientId,
        ...(options.unreadOnly ? { isRead: false } : {}),
      },
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options.limit ?? 20,
    });

    if (rawNotifications.length === 0) {
      return [];
    }

    // Récupérer les métadonnées de cible par lot
    const songIds = Array.from(
      new Set(rawNotifications.map((n) => n.songId).filter((id): id is string => Boolean(id))),
    );
    const albumIds = Array.from(
      new Set(rawNotifications.map((n) => n.albumId).filter((id): id is string => Boolean(id))),
    );
    const commentIds = Array.from(
      new Set(rawNotifications.map((n) => n.commentId).filter((id): id is string => Boolean(id))),
    );

    const [songs, albums, comments] = await Promise.all([
      songIds.length > 0
        ? prisma.song.findMany({
            where: { id: { in: songIds } },
            select: { id: true, title: true },
          })
        : [],
      albumIds.length > 0
        ? prisma.album.findMany({
            where: { id: { in: albumIds } },
            select: { id: true, title: true },
          })
        : [],
      commentIds.length > 0
        ? prisma.comment.findMany({
            where: { id: { in: commentIds } },
            select: { id: true, songId: true, song: { select: { title: true } } },
          })
        : [],
    ]);

    const songMap = new Map(songs.map((s) => [s.id, s.title]));
    const albumMap = new Map(albums.map((a) => [a.id, a.title]));
    const commentMap = new Map(
      comments.map((c) => [c.id, { songId: c.songId, title: c.song?.title }]),
    );

    return rawNotifications.map((n) => {
      let target: NotificationTarget | null = null;

      if (n.commentId) {
        const commentInfo = commentMap.get(n.commentId);
        target = {
          resourceType: 'comment',
          resourceId: n.commentId,
          songId: n.songId ?? commentInfo?.songId,
          title: (n.songId ? songMap.get(n.songId) : commentInfo?.title) ?? undefined,
        };
      } else if (n.songId) {
        target = {
          resourceType: 'song',
          resourceId: n.songId,
          title: songMap.get(n.songId) ?? undefined,
        };
      } else if (n.albumId) {
        target = {
          resourceType: 'album',
          resourceId: n.albumId,
          title: albumMap.get(n.albumId) ?? undefined,
        };
      } else if (n.invitationId) {
        target = {
          resourceType: 'invitation',
          resourceId: n.invitationId,
          title: n.songId ? songMap.get(n.songId) : n.albumId ? albumMap.get(n.albumId) : undefined,
        };
      }

      return {
        id: n.id,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        actor: n.actor
          ? {
              id: n.actor.id,
              displayName: n.actor.displayName,
              avatarUrl: n.actor.avatarUrl,
            }
          : null,
        target,
      };
    });
  },

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(id: string, recipientId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, recipientId },
    });
    if (!notification) {
      return null;
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  },

  /**
   * Marquer toutes les notifications non lues comme lues
   */
  async markAllAsRead(recipientId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId,
        isRead: false,
      },
      data: { isRead: true },
    });
    return result.count;
  },

  /**
   * Obtenir les préférences de notification d'un utilisateur
   */
  getSettings(userId: string): NotificationSettings {
    const existing = userSettingsStore.get(userId);
    if (!existing) {
      return {
        inApp: { ...DEFAULT_NOTIFICATION_SETTINGS.inApp },
        email: { ...DEFAULT_NOTIFICATION_SETTINGS.email },
      };
    }
    return {
      inApp: { ...existing.inApp },
      email: { ...existing.email },
    };
  },

  /**
   * Mettre à jour les préférences de notification d'un utilisateur
   */
  updateSettings(userId: string, input: UpdateNotificationSettingsInput): NotificationSettings {
    const current = this.getSettings(userId);
    const updated: NotificationSettings = {
      inApp: {
        ...current.inApp,
        ...(input.inApp ?? {}),
      },
      email: {
        ...current.email,
        ...(input.email ?? {}),
      },
    };
    userSettingsStore.set(userId, updated);
    return updated;
  },

  /**
   * Réinitialiser le cache pour les tests
   */
  clearSettingsForTesting(): void {
    userSettingsStore.clear();
  },
};
