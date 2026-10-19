import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import { notificationQuerySchema, updateNotificationSettingsSchema } from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import { notificationsService } from './notifications.service.js';
import { notificationsSSE } from './notifications.sse.js';
import { NotFoundAccessError } from '../permissions/permissions.service.js';

const idParamSchema = z.object({ id: z.string().min(1) });

function handleNotificationError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof NotFoundAccessError) {
    return reply.status(404).send({ message: error.message || 'Ressource introuvable' });
  }
  throw error;
}

export const notificationsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  /**
   * GET /api/notifications
   * Récupère la liste des notifications de l'utilisateur connecté
   */
  app.get('/notifications', { preHandler: requireAuth }, async (request, reply) => {
    const query = notificationQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({
        message: 'Paramètres de requête invalides',
        errors: query.error.format(),
      });
    }

    try {
      const result = await notificationsService.listNotifications(request.user!, query.data);
      return reply.send(result);
    } catch (error) {
      return handleNotificationError(reply, error);
    }
  });

  /**
   * GET /api/notifications/stream
   * Flux Server-Sent Events (SSE) temps réel
   */
  app.get('/notifications/stream', { preHandler: requireAuth }, async (request, reply) => {
    await notificationsSSE.registerClient(request.user!.id, request, reply);
  });

  /**
   * PATCH /api/notifications/:id/read
   * Marquer une notification comme lue
   */
  app.patch('/notifications/:id/read', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant invalide' });
    }

    try {
      const result = await notificationsService.markAsRead(request.user!, params.data.id);
      return reply.send(result);
    } catch (error) {
      return handleNotificationError(reply, error);
    }
  });

  /**
   * POST /api/notifications/read-all
   * Marquer toutes les notifications comme lues
   */
  app.post('/notifications/read-all', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const result = await notificationsService.markAllAsRead(request.user!);
      return reply.send(result);
    } catch (error) {
      return handleNotificationError(reply, error);
    }
  });

  /**
   * GET /api/notifications/settings
   * Obtenir les réglages de notification de l'utilisateur
   */
  app.get('/notifications/settings', { preHandler: requireAuth }, async (request, reply) => {
    const settings = notificationsService.getSettings(request.user!);
    return reply.send(settings);
  });

  /**
   * PUT /api/notifications/settings
   * Mettre à jour les préférences de notifications
   */
  app.put('/notifications/settings', { preHandler: requireAuth }, async (request, reply) => {
    const body = updateNotificationSettingsSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        message: 'Préférences de notification invalides',
        errors: body.error.format(),
      });
    }

    const updated = notificationsService.updateSettings(request.user!, body.data);
    return reply.send(updated);
  });
};
