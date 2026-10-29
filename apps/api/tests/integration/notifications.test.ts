import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';
import { clearDatabase } from '../helpers/db.js';
import { notificationsService } from '../../src/modules/notifications/notifications.service.js';
import { notificationsSSE } from '../../src/modules/notifications/notifications.sse.js';
import * as emailService from '../../src/modules/auth/email.service.js';

describe("Tests d'intégration : Notifications collaboratives (/api/notifications)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    notificationsSSE.closeAll();
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    notificationsService.clearQueuesForTesting();
    emailService.clearSentEmailsForTesting();
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

  describe('GET /api/notifications — Consultation des notifications', () => {
    it('renvoie une liste vide avec un compteur à 0 par défaut', async () => {
      const { sessionId } = await registerUser('notif-empty@verso.fr', 'Artiste Solo');

      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications',
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.unreadCount).toBe(0);
      expect(body.notifications).toEqual([]);
    });

    it('liste les notifications reçues avec enrichissement et respect strict de la confidentialité (zéro email)', async () => {
      const { userId: ownerId } = await registerUser('owner-author@verso.fr', 'Booba');
      const { userId: recipientId, sessionId: recipientSession } = await registerUser(
        'recipient-author@verso.fr',
        'Ali',
      );

      // Créer un morceau
      const song = await prisma.song.create({
        data: {
          title: 'Temps Mort',
          content: 'Lève les bras...',
          userId: ownerId,
        },
      });

      // Émettre une notification INVITATION_RECEIVED via le service
      await notificationsService.sendNotification({
        type: 'INVITATION_RECEIVED',
        recipientId,
        actorId: ownerId,
        songId: song.id,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications',
        cookies: authCookie(recipientSession),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.unreadCount).toBe(1);
      expect(body.notifications.length).toBe(1);

      const notif = body.notifications[0];
      expect(notif.type).toBe('INVITATION_RECEIVED');
      expect(notif.isRead).toBe(false);
      expect(notif.actor).toBeDefined();
      expect(notif.actor.id).toBe(ownerId);
      expect(notif.actor.displayName).toBe('Booba');
      // Confidentialité stricte des artistes : zéro fuite d'email
      expect(notif.actor.email).toBeUndefined();
      expect(notif.target).toBeDefined();
      expect(notif.target.resourceType).toBe('song');
      expect(notif.target.title).toBe('Temps Mort');
    });

    it('permet de filtrer les alertes non lues avec unlimit paramétrable', async () => {
      const { userId: ownerId } = await registerUser('owner-filter@verso.fr', 'Kaaris');
      const { userId: recipientId, sessionId: recipientSession } = await registerUser(
        'recipient-filter@verso.fr',
        'Kalash',
      );

      // Créer 3 notifications : 2 non lues, 1 lue
      const notif1 = await notificationsService.sendNotification({
        type: 'COMMENT_ADDED',
        recipientId,
        actorId: ownerId,
      });
      await notificationsService.sendNotification({
        type: 'MENTION',
        recipientId,
        actorId: ownerId,
      });
      await notificationsService.sendNotification({
        type: 'INVITATION_RECEIVED',
        recipientId,
        actorId: ownerId,
      });

      // Marquer notif1 comme lue directement
      await prisma.notification.update({
        where: { id: notif1!.id },
        data: { isRead: true },
      });

      // Requête avec unreadOnly=true
      const unreadResponse = await app.inject({
        method: 'GET',
        url: '/api/notifications?unreadOnly=true',
        cookies: authCookie(recipientSession),
      });

      expect(unreadResponse.statusCode).toBe(200);
      const unreadBody = unreadResponse.json();
      expect(unreadBody.unreadCount).toBe(2);
      expect(unreadBody.notifications.length).toBe(2);
      expect(unreadBody.notifications.every((n: { isRead: boolean }) => !n.isRead)).toBe(true);

      // Requête avec limit=1
      const limitedResponse = await app.inject({
        method: 'GET',
        url: '/api/notifications?limit=1',
        cookies: authCookie(recipientSession),
      });

      expect(limitedResponse.statusCode).toBe(200);
      const limitedBody = limitedResponse.json();
      expect(limitedBody.notifications.length).toBe(1);
    });
  });

  describe('PATCH /api/notifications/:id/read — Marquer une notification comme lue', () => {
    it('marque avec succès une notification comme lue', async () => {
      const { userId: ownerId } = await registerUser('owner-read@verso.fr', 'RimK');
      const { userId: recipientId, sessionId: recipientSession } = await registerUser(
        'recipient-read@verso.fr',
        'AP',
      );

      const notif = await notificationsService.sendNotification({
        type: 'COMMENT_ADDED',
        recipientId,
        actorId: ownerId,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/notifications/${notif!.id}/read`,
        cookies: authCookie(recipientSession),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        id: notif!.id,
        isRead: true,
      });

      // Vérifier en base
      const inDb = await prisma.notification.findUnique({ where: { id: notif!.id } });
      expect(inDb?.isRead).toBe(true);
    });

    it('renvoie 404 Not Found (zéro fuite d’existence) si la notification appartient à un autre artiste', async () => {
      const { sessionId: sessionA } = await registerUser('artist-a@verso.fr', 'Artiste A');
      const { userId: userB } = await registerUser('artist-b@verso.fr', 'Artiste B');

      // Notification pour userB
      const notifB = await notificationsService.sendNotification({
        type: 'MENTION',
        recipientId: userB,
      });

      // Tentative d'accès par userA
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/notifications/${notifB!.id}/read`,
        cookies: authCookie(sessionA),
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Ressource introuvable');
    });
  });

  describe('POST /api/notifications/read-all — Marquer tout comme lu', () => {
    it('marque toutes les notifications de l’utilisateur comme lues', async () => {
      const { userId: ownerId } = await registerUser('owner-all@verso.fr', 'Nekfeu');
      const { userId: recipientId, sessionId: recipientSession } = await registerUser(
        'recipient-all@verso.fr',
        'Alpha',
      );

      await notificationsService.sendNotification({
        type: 'COMMENT_ADDED',
        recipientId,
        actorId: ownerId,
      });
      await notificationsService.sendNotification({
        type: 'MENTION',
        recipientId,
        actorId: ownerId,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/notifications/read-all',
        cookies: authCookie(recipientSession),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().markedCount).toBe(2);

      const unreadCount = await notificationsService.listNotifications(
        { id: recipientId },
        { limit: 20 },
      );
      expect(unreadCount.unreadCount).toBe(0);
    });
  });

  describe('GET & PUT /api/notifications/settings — Préférences de notification', () => {
    it('renvoie les réglages par défaut', async () => {
      const { sessionId } = await registerUser('settings-user@verso.fr', 'Dinos');

      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications/settings',
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.inApp).toEqual({
        invitations: true,
        comments: true,
        mentions: true,
      });
      expect(body.email).toEqual({
        invitations: true,
        comments: false,
        mentions: true,
      });
    });

    it('met à jour les préférences de notification', async () => {
      const { sessionId } = await registerUser('settings-update@verso.fr', 'Damso');

      const response = await app.inject({
        method: 'PUT',
        url: '/api/notifications/settings',
        cookies: authCookie(sessionId),
        payload: {
          email: {
            invitations: false,
            mentions: false,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.email.invitations).toBe(false);
      expect(body.email.mentions).toBe(false);

      // Re-lecture pour vérifier la persistance
      const checkResponse = await app.inject({
        method: 'GET',
        url: '/api/notifications/settings',
        cookies: authCookie(sessionId),
      });

      expect(checkResponse.json().email.invitations).toBe(false);
    });
  });

  describe('Emails groupés & Debounce 3 minutes', () => {
    it('regroupe les notifications éligibles et envoie un email unique lors du flush', async () => {
      const { userId: ownerId } = await registerUser('owner-batch@verso.fr', 'Oxmo');
      const { userId: recipientId } = await registerUser('recipient-batch@verso.fr', 'Kery');

      // Vider les emails de bienvenue issus de l'inscription
      emailService.clearSentEmailsForTesting();

      // Émettre une invitation et une mention (les deux ont email=true par défaut)
      await notificationsService.sendNotification({
        type: 'INVITATION_RECEIVED',
        recipientId,
        actorId: ownerId,
      });
      await notificationsService.sendNotification({
        type: 'MENTION',
        recipientId,
        actorId: ownerId,
      });

      expect(notificationsService.getPendingEmailsCount(recipientId)).toBe(2);

      // Aucun email n'a encore été envoyé (debounce en cours)
      expect(emailService.getSentEmailsForTesting().length).toBe(0);

      // Déclencher le flush manuel du regroupement
      await notificationsService.flushPendingEmails(recipientId);

      // Un seul email récapitulatif a été envoyé
      const sentEmails = emailService.getSentEmailsForTesting();
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toBe('recipient-batch@verso.fr');
      expect(sentEmails[0].subject).toContain('2 nouvelles notifications');
      expect(sentEmails[0].text).toContain('Oxmo t’a invité à collaborer');
      expect(sentEmails[0].text).toContain('Oxmo t’a mentionné dans une discussion');

      // File d'attente vidée
      expect(notificationsService.getPendingEmailsCount(recipientId)).toBe(0);
    });

    it('respecte les préférences utilisateur : ne met rien en file si l’email est désactivé', async () => {
      const { userId: ownerId } = await registerUser('owner-nopref@verso.fr', 'Youssoupha');
      const { userId: recipientId } = await registerUser('recipient-nopref@verso.fr', 'Disiz');

      // Désactiver les emails d'invitation pour recipientId
      notificationsService.updateSettings({ id: recipientId }, { email: { invitations: false } });

      await notificationsService.sendNotification({
        type: 'INVITATION_RECEIVED',
        recipientId,
        actorId: ownerId,
      });

      // Aucun email mis en file d'attente
      expect(notificationsService.getPendingEmailsCount(recipientId)).toBe(0);
    });
  });

  describe('Protection anti-harcèlement (FR-032)', () => {
    it('neutralise immédiatement les notifications si un blocage mutuel existe', async () => {
      const { userId: blockerId } = await registerUser('blocker@verso.fr', 'Artiste Tranquille');
      const { userId: blockedId } = await registerUser('blocked@verso.fr', 'Artiste Toxique');

      // Créer un blocage
      await prisma.userBlock.create({
        data: {
          blockerId,
          blockedId,
        },
      });

      // L'artiste bloqué tente de mentionner le bloqueur
      const notification = await notificationsService.sendNotification({
        type: 'MENTION',
        recipientId: blockerId,
        actorId: blockedId,
      });

      expect(notification).toBeNull();

      // Vérifier qu'aucune notification n'est enregistrée
      const notifs = await prisma.notification.findMany({
        where: { recipientId: blockerId },
      });
      expect(notifs.length).toBe(0);
    });
  });

  describe('Flux SSE (Server-Sent Events)', () => {
    it('gère l’émission d’événements en direct sans exception', () => {
      // Vérifier le bon fonctionnement des méthodes de notificationsSSE
      expect(notificationsSSE.getConnectionCount()).toBe(0);
      const sent = notificationsSSE.sendEventToUser('non-existent-user', 'notification', {
        test: true,
      });
      expect(sent).toBe(false);
    });
  });
});
