import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  createAbuseReportSchema,
  searchUsersQuerySchema,
  updateProfileSchema,
} from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import { NotFoundAccessError } from '../permissions/permissions.service.js';
import { ModerationServiceError, moderationService } from './moderation.service.js';

const idParamSchema = z.object({ id: z.string().min(1) });

function handleModerationError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof NotFoundAccessError) {
    return reply.status(404).send({ message: error.message || 'Ressource introuvable' });
  }
  if (error instanceof ModerationServiceError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }
  throw error;
}

export const moderationRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  /**
   * GET /api/users/search
   * Recherche d'artistes anti-énumération avec rate limiting strict (10 req/min, FR-038)
   */
  app.get(
    '/users/search',
    {
      preHandler: requireAuth,
      config: {
        rateLimit:
          process.env.NODE_ENV === 'test'
            ? false
            : {
                max: 10,
                timeWindow: '1 minute',
              },
      },
    },
    async (request, reply) => {
      const parsed = searchUsersQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          message: 'Paramètres de recherche invalides',
          errors: parsed.error.format(),
        });
      }

      try {
        const result = await moderationService.searchUsers(request.user!.id, parsed.data.q);
        return reply.send(result);
      } catch (error) {
        return handleModerationError(reply, error);
      }
    },
  );

  /**
   * GET /api/users/blocked
   * Liste des utilisateurs bloqués par le compte connecté
   */
  app.get('/users/blocked', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const result = await moderationService.getBlockedUsers(request.user!.id);
      return reply.send(result);
    } catch (error) {
      return handleModerationError(reply, error);
    }
  });

  /**
   * GET /api/users/:id/profile
   * Consultation du profil minimal d'un artiste (FR-030, FR-031, sans email)
   */
  app.get('/users/:id/profile', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant invalide' });
    }

    try {
      const result = await moderationService.getUserProfile(request.user!.id, params.data.id);
      return reply.send(result);
    } catch (error) {
      return handleModerationError(reply, error);
    }
  });

  /**
   * PATCH /api/users/profile
   * Mise à jour de son profil (bio courte max 280, nom d'artiste, avatar)
   */
  app.patch('/users/profile', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: 'Données de profil invalides',
        errors: parsed.error.format(),
      });
    }

    try {
      const result = await moderationService.updateProfile(request.user!.id, parsed.data);
      return reply.send(result);
    } catch (error) {
      return handleModerationError(reply, error);
    }
  });

  /**
   * POST /api/users/:id/block
   * Bloquer un utilisateur avec rupture bilatérale immédiate (FR-032)
   */
  app.post(
    '/users/:id/block',
    { preHandler: requireAuth, config: { allowEmptyBody: true } },
    async (request, reply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiant invalide' });
      }

      try {
        const result = await moderationService.blockUser(request.user!.id, params.data.id);
        return reply.send(result);
      } catch (error) {
        return handleModerationError(reply, error);
      }
    },
  );

  /**
   * DELETE /api/users/:id/block
   * Débloquer un utilisateur
   */
  app.delete('/users/:id/block', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant invalide' });
    }

    try {
      const result = await moderationService.unblockUser(request.user!.id, params.data.id);
      return reply.send(result);
    } catch (error) {
      return handleModerationError(reply, error);
    }
  });

  /**
   * POST /api/reports
   * Signalement de contenu ou comportement abusif (FR-033)
   */
  app.post('/reports', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createAbuseReportSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: 'Données de signalement invalides',
        errors: parsed.error.format(),
      });
    }

    try {
      const result = await moderationService.createReport(request.user!.id, parsed.data);
      return reply.status(201).send(result);
    } catch (error) {
      return handleModerationError(reply, error);
    }
  });

  /**
   * GET /api/songs/:id/activity
   * Journal chronologique d'activité récente d'un texte (FR-034)
   */
  app.get('/songs/:id/activity', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant invalide' });
    }

    try {
      const result = await moderationService.getSongActivity(request.user!.id, params.data.id);
      return reply.send(result);
    } catch (error) {
      return handleModerationError(reply, error);
    }
  });
};
