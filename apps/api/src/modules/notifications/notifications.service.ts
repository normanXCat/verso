import { prisma } from '../../config/prisma.js';
import { NotFoundAccessError } from '../permissions/permissions.service.js';
import {
  notificationsRepository,
  type CreateNotificationData,
} from './notifications.repository.js';
import { notificationsSSE } from './notifications.sse.js';
import { sendNotificationEmail } from '../auth/email.service.js';
import type {
  NotificationQuery,
  NotificationType,
  NotificationSettings,
  UpdateNotificationSettingsInput,
  NotificationItem,
} from '@verso/shared';

// Délai de regroupement d'emails (3 minutes conformément aux spécifications)
export const EMAIL_DEBOUNCE_MS = 3 * 60 * 1000;

interface PendingEmailItem {
  type: NotificationType;
  actorName?: string;
  targetTitle?: string;
  createdAt: Date;
}

interface UserEmailBatch {
  timer: NodeJS.Timeout | null;
  items: PendingEmailItem[];
}

const pendingEmailBatches = new Map<string, UserEmailBatch>();

export const notificationsService = {
  /**
   * Émettre une nouvelle notification (in-app SSE + email différé selon préférences)
   */
  async sendNotification(data: CreateNotificationData) {
    // Règle constitutionnelle FR-032 : vérifier le blocage mutuel
    if (data.actorId && data.recipientId && data.actorId !== data.recipientId) {
      const isBlocked = await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: data.actorId, blockedId: data.recipientId },
            { blockerId: data.recipientId, blockedId: data.actorId },
          ],
        },
      });

      if (isBlocked) {
        return null;
      }
    }

    // Créer la notification en base
    const created = await notificationsRepository.createNotification(data);

    // Charger les préférences de l'utilisateur
    const settings = notificationsRepository.getSettings(data.recipientId);

    // 1. Diffusion en direct dans l'application (Server-Sent Events)
    const canSendInApp = this.canSendInApp(data.type, settings);
    if (canSendInApp) {
      // Formater la notification pour le flux SSE
      const formattedList = await notificationsRepository.listNotificationsByRecipient(
        data.recipientId,
        { limit: 1 },
      );
      const notificationItem = formattedList[0];

      if (notificationItem) {
        notificationsSSE.sendEventToUser(data.recipientId, 'notification', notificationItem);
      }

      // Mettre à jour le compteur d'alertes non lues
      const unreadCount = await notificationsRepository.countUnread(data.recipientId);
      notificationsSSE.sendUnreadCount(data.recipientId, unreadCount);
    }

    // 2. Regroupement des emails transactionnels avec debounce de 3 minutes
    const canSendEmail = this.canSendEmail(data.type, settings);
    if (canSendEmail) {
      let actorName: string | undefined;
      if (data.actorId) {
        const actor = await prisma.user.findUnique({
          where: { id: data.actorId },
          select: { displayName: true },
        });
        actorName = actor?.displayName ?? undefined;
      }

      let targetTitle: string | undefined;
      if (data.songId) {
        const song = await prisma.song.findUnique({
          where: { id: data.songId },
          select: { title: true },
        });
        targetTitle = song?.title;
      } else if (data.albumId) {
        const album = await prisma.album.findUnique({
          where: { id: data.albumId },
          select: { title: true },
        });
        targetTitle = album?.title;
      }

      this.queueEmailNotification(data.recipientId, {
        type: data.type,
        actorName,
        targetTitle,
        createdAt: new Date(),
      });
    }

    return created;
  },

  /**
   * Vérifie si le type d'alerte est autorisé en in-app
   */
  canSendInApp(type: NotificationType, settings: NotificationSettings): boolean {
    switch (type) {
      case 'INVITATION_RECEIVED':
      case 'INVITATION_ACCEPTED':
      case 'INVITATION_DECLINED':
        return settings.inApp.invitations;
      case 'COMMENT_ADDED':
      case 'COMMENT_REPLY':
        return settings.inApp.comments;
      case 'MENTION':
        return settings.inApp.mentions;
      case 'CONFLICT_DETECTED':
      default:
        return true;
    }
  },

  /**
   * Vérifie si le type d'alerte est autorisé pour l'envoi d'email
   */
  canSendEmail(type: NotificationType, settings: NotificationSettings): boolean {
    switch (type) {
      case 'INVITATION_RECEIVED':
        return settings.email.invitations;
      case 'MENTION':
        return settings.email.mentions;
      case 'COMMENT_ADDED':
      case 'COMMENT_REPLY':
        return settings.email.comments;
      default:
        return false;
    }
  },

  /**
   * Ajoute une notification à la file d'attente d'emails groupés (debounce 3 min)
   */
  queueEmailNotification(recipientId: string, item: PendingEmailItem): void {
    let batch = pendingEmailBatches.get(recipientId);
    if (!batch) {
      batch = {
        timer: null,
        items: [],
      };
      pendingEmailBatches.set(recipientId, batch);
    }

    batch.items.push(item);

    // Si aucun timer n'est actif, en lancer un
    if (!batch.timer) {
      batch.timer = setTimeout(() => {
        void this.flushPendingEmails(recipientId);
      }, EMAIL_DEBOUNCE_MS);
    }
  },

  /**
   * Expédie immédiatement le récapitulatif d'emails en attente pour un utilisateur (ou tous)
   */
  async flushPendingEmails(recipientId?: string): Promise<boolean> {
    if (!recipientId) {
      // Vider tous les destinataires
      const userIds = Array.from(pendingEmailBatches.keys());
      const results = await Promise.all(userIds.map((uid) => this.flushPendingEmails(uid)));
      return results.some(Boolean);
    }

    const batch = pendingEmailBatches.get(recipientId);
    if (!batch || batch.items.length === 0) {
      if (batch?.timer) clearTimeout(batch.timer);
      pendingEmailBatches.delete(recipientId);
      return false;
    }

    if (batch.timer) {
      clearTimeout(batch.timer);
      batch.timer = null;
    }

    const itemsToSend = [...batch.items];
    batch.items = [];
    pendingEmailBatches.delete(recipientId);

    const user = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { email: true, displayName: true },
    });

    if (!user || !user.email) {
      return false;
    }

    return sendNotificationEmail({
      to: user.email,
      items: itemsToSend,
      displayName: user.displayName,
    });
  },

  /**
   * Lister les notifications d'un utilisateur
   */
  async listNotifications(
    user: { id: string },
    query: NotificationQuery,
  ): Promise<{ unreadCount: number; notifications: NotificationItem[] }> {
    const [unreadCount, notifications] = await Promise.all([
      notificationsRepository.countUnread(user.id),
      notificationsRepository.listNotificationsByRecipient(user.id, {
        unreadOnly: query.unreadOnly ?? (query.isRead === false ? true : undefined),
        limit: query.limit,
      }),
    ]);

    return {
      unreadCount,
      notifications,
    };
  },

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(user: { id: string }, notificationId: string) {
    const updated = await notificationsRepository.markAsRead(notificationId, user.id);
    if (!updated) {
      throw new NotFoundAccessError('Ressource introuvable');
    }

    const unreadCount = await notificationsRepository.countUnread(user.id);
    notificationsSSE.sendUnreadCount(user.id, unreadCount);

    return {
      id: updated.id,
      isRead: updated.isRead,
    };
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(user: { id: string }) {
    const markedCount = await notificationsRepository.markAllAsRead(user.id);
    notificationsSSE.sendUnreadCount(user.id, 0);

    return {
      markedCount,
    };
  },

  /**
   * Obtenir les réglages de notification
   */
  getSettings(user: { id: string }): NotificationSettings {
    return notificationsRepository.getSettings(user.id);
  },

  /**
   * Mettre à jour les réglages de notification
   */
  updateSettings(
    user: { id: string },
    input: UpdateNotificationSettingsInput,
  ): NotificationSettings {
    return notificationsRepository.updateSettings(user.id, input);
  },

  /**
   * Nombre d'emails en file d'attente pour un utilisateur
   */
  getPendingEmailsCount(recipientId: string): number {
    return pendingEmailBatches.get(recipientId)?.items.length ?? 0;
  },

  /**
   * Réinitialisation complète pour les tests
   */
  clearQueuesForTesting(): void {
    for (const [, batch] of pendingEmailBatches) {
      if (batch.timer) clearTimeout(batch.timer);
    }
    pendingEmailBatches.clear();
    notificationsRepository.clearSettingsForTesting();
    notificationsSSE.closeAll();
  },
};
