import { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createCommentSchema, replyCommentSchema, commentQuerySchema } from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import { commentsService } from './comments.service.js';
import { NotFoundAccessError } from '../permissions/permissions.service.js';

function rateLimitFor(max: number): false | { max: number; timeWindow: string } {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  return {
    max,
    timeWindow: '1 minute',
  };
}

const idParamSchema = z.object({ id: z.string().min(1) });

function handleCommentError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof NotFoundAccessError) {
    return reply.status(404).send({ message: error.message || 'Ressource introuvable' });
  }
  throw error;
}

export const commentsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // ==========================================
  // Commentaires sur un morceau
  // ==========================================

  // Lister les commentaires d'un morceau
  app.get('/songs/:id/comments', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant invalide' });
    }

    const query = commentQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({
        message: 'Paramètres de requête invalides',
        errors: query.error.format(),
      });
    }

    try {
      const comments = await commentsService.listComments(
        request.user!,
        params.data.id,
        query.data.isResolved,
      );
      return reply.send({ comments });
    } catch (error) {
      return handleCommentError(reply, error);
    }
  });

  // Créer un commentaire ancré sur un morceau (limité à 20 req/min)
  app.post(
    '/songs/:id/comments',
    {
      preHandler: requireAuth,
      config: { rateLimit: rateLimitFor(20) },
    },
    async (request, reply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiant invalide' });
      }

      const body = createCommentSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          message: 'Données de commentaire invalides',
          errors: body.error.format(),
        });
      }

      try {
        const comment = await commentsService.createComment(
          request.user!,
          params.data.id,
          body.data,
        );
        return reply.status(201).send({ comment });
      } catch (error) {
        return handleCommentError(reply, error);
      }
    },
  );

  // ==========================================
  // Actions sur un fil de discussion existant
  // ==========================================

  // Répondre à un commentaire (limité à 20 req/min)
  app.post(
    '/comments/:id/replies',
    {
      preHandler: requireAuth,
      config: { rateLimit: rateLimitFor(20) },
    },
    async (request, reply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiant invalide' });
      }

      const body = replyCommentSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          message: 'Données de réponse invalides',
          errors: body.error.format(),
        });
      }

      try {
        const replyRecord = await commentsService.replyToComment(
          request.user!,
          params.data.id,
          body.data,
        );
        return reply.status(201).send({ reply: replyRecord });
      } catch (error) {
        return handleCommentError(reply, error);
      }
    },
  );

  // Résoudre un commentaire
  app.patch(
    '/comments/:id/resolve',
    { preHandler: requireAuth, config: { allowEmptyBody: true } },
    async (request, reply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiant invalide' });
      }

      try {
        const comment = await commentsService.resolveComment(request.user!, params.data.id);
        return reply.send({ comment });
      } catch (error) {
        return handleCommentError(reply, error);
      }
    },
  );

  // Rouvrir un commentaire
  app.patch(
    '/comments/:id/reopen',
    { preHandler: requireAuth, config: { allowEmptyBody: true } },
    async (request, reply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiant invalide' });
      }

      try {
        const comment = await commentsService.reopenComment(request.user!, params.data.id);
        return reply.send({ comment });
      } catch (error) {
        return handleCommentError(reply, error);
      }
    },
  );

  // Supprimer un commentaire
  app.delete('/comments/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant invalide' });
    }

    try {
      await commentsService.deleteComment(request.user!, params.data.id);
      return reply.status(204).send();
    } catch (error) {
      return handleCommentError(reply, error);
    }
  });
};
