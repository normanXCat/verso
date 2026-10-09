import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import { updateSongCreditsSchema } from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import { creditsService } from './credits.service.js';
import { NotFoundAccessError } from '../permissions/permissions.service.js';

const idParamSchema = z.object({ id: z.string().min(1) });

function handleCreditsError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof NotFoundAccessError) {
    return reply.status(404).send({ message: error.message || 'Ressource introuvable' });
  }
  throw error;
}

export const creditsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  /**
   * GET /api/songs/:id/credits
   * Récupère la liste ordonnée des crédits déclarés sur un texte
   */
  app.get('/songs/:id/credits', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant invalide' });
    }

    try {
      const result = await creditsService.getCredits(request.user!, params.data.id);
      return reply.send(result);
    } catch (error) {
      return handleCreditsError(reply, error);
    }
  });

  /**
   * PUT /api/songs/:id/credits
   * Définit ou met à jour l'ensemble des crédits déclarés sur un texte
   */
  app.put('/songs/:id/credits', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant invalide' });
    }

    const body = updateSongCreditsSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        message: 'Format des crédits invalide',
        errors: body.error.format(),
      });
    }

    try {
      const result = await creditsService.setCredits(request.user!, params.data.id, body.data);
      return reply.send(result);
    } catch (error) {
      return handleCreditsError(reply, error);
    }
  });
};
