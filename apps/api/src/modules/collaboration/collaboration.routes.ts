import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  createInvitationSchema,
  updateCollaboratorRoleSchema,
  sharedWithMeQuerySchema,
} from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import { collaborationService, CollaborationError } from './collaboration.service.js';
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
const collaboratorParamSchema = z.object({ id: z.string().min(1), userId: z.string().min(1) });
const tokenParamSchema = z.object({ token: z.string().min(1) });
const leaveParamSchema = z.object({
  resourceType: z
    .enum(['song', 'songs', 'album', 'albums'])
    .transform((val): 'song' | 'album' =>
      val === 'songs' ? 'song' : val === 'albums' ? 'album' : val,
    ),
  resourceId: z.string().min(1),
});

function handleCollaborationError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof NotFoundAccessError) {
    return reply.status(404).send({ message: error.message || 'Ressource introuvable' });
  }
  if (error instanceof CollaborationError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }
  throw error;
}

export const collaborationRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // ==========================================
  // Morceaux (Songs)
  // ==========================================

  // Inviter un collaborateur sur un morceau (limité à 10 req/min)
  app.post(
    '/songs/:id/invitations',
    {
      preHandler: requireAuth,
      config: { rateLimit: rateLimitFor(10) },
    },
    async (request, reply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiant invalide' });
      }

      const body = createInvitationSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          message: 'Données d’invitation invalides',
          errors: body.error.flatten(),
        });
      }

      try {
        const result = await collaborationService.inviteToSong(
          request.user!,
          params.data.id,
          body.data,
        );
        return reply.status(201).send(result);
      } catch (error) {
        return handleCollaborationError(reply, error);
      }
    },
  );

  // Lister les collaborateurs et invitations en attente d'un morceau
  const getSongCollaboratorsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant invalide' });
    }

    try {
      const result = await collaborationService.getSongCollaborators(request.user!, params.data.id);
      return reply.status(200).send(result);
    } catch (error) {
      return handleCollaborationError(reply, error);
    }
  };

  app.get('/songs/:id/collaborators', { preHandler: requireAuth }, getSongCollaboratorsHandler);
  app.get('/songs/:id/invitations', { preHandler: requireAuth }, getSongCollaboratorsHandler);

  // Modifier le rôle d'un collaborateur sur un morceau
  app.patch(
    '/songs/:id/collaborators/:userId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = collaboratorParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Paramètres invalides' });
      }

      const body = updateCollaboratorRoleSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          message: 'Données de rôle invalides',
          errors: body.error.flatten(),
        });
      }

      try {
        const result = await collaborationService.updateCollaboratorRole(
          request.user!,
          { songId: params.data.id },
          params.data.userId,
          body.data.role,
        );
        return reply.status(200).send(result);
      } catch (error) {
        return handleCollaborationError(reply, error);
      }
    },
  );

  // Révoquer un collaborateur sur un morceau
  app.delete(
    '/songs/:id/collaborators/:userId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = collaboratorParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Paramètres invalides' });
      }

      try {
        const result = await collaborationService.revokeCollaborator(
          request.user!,
          { songId: params.data.id },
          params.data.userId,
        );
        return reply.status(200).send(result);
      } catch (error) {
        return handleCollaborationError(reply, error);
      }
    },
  );

  // ==========================================
  // Albums
  // ==========================================

  // Inviter un collaborateur sur un album (limité à 10 req/min)
  app.post(
    '/albums/:id/invitations',
    {
      preHandler: requireAuth,
      config: { rateLimit: rateLimitFor(10) },
    },
    async (request, reply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiant invalide' });
      }

      const body = createInvitationSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          message: 'Données d’invitation invalides',
          errors: body.error.flatten(),
        });
      }

      try {
        const result = await collaborationService.inviteToAlbum(
          request.user!,
          params.data.id,
          body.data,
        );
        return reply.status(201).send(result);
      } catch (error) {
        return handleCollaborationError(reply, error);
      }
    },
  );

  // Lister les collaborateurs et invitations en attente d'un album
  const getAlbumCollaboratorsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant invalide' });
    }

    try {
      const result = await collaborationService.getAlbumCollaborators(
        request.user!,
        params.data.id,
      );
      return reply.status(200).send(result);
    } catch (error) {
      return handleCollaborationError(reply, error);
    }
  };

  app.get('/albums/:id/collaborators', { preHandler: requireAuth }, getAlbumCollaboratorsHandler);
  app.get('/albums/:id/invitations', { preHandler: requireAuth }, getAlbumCollaboratorsHandler);

  // Modifier le rôle d'un collaborateur sur un album
  app.patch(
    '/albums/:id/collaborators/:userId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = collaboratorParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Paramètres invalides' });
      }

      const body = updateCollaboratorRoleSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          message: 'Données de rôle invalides',
          errors: body.error.flatten(),
        });
      }

      try {
        const result = await collaborationService.updateCollaboratorRole(
          request.user!,
          { albumId: params.data.id },
          params.data.userId,
          body.data.role,
        );
        return reply.status(200).send(result);
      } catch (error) {
        return handleCollaborationError(reply, error);
      }
    },
  );

  // Révoquer un collaborateur sur un album
  app.delete(
    '/albums/:id/collaborators/:userId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = collaboratorParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Paramètres invalides' });
      }

      try {
        const result = await collaborationService.revokeCollaborator(
          request.user!,
          { albumId: params.data.id },
          params.data.userId,
        );
        return reply.status(200).send(result);
      } catch (error) {
        return handleCollaborationError(reply, error);
      }
    },
  );

  // ==========================================
  // Acceptation / Refus d'invitations
  // ==========================================

  const acceptHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = tokenParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Jeton invalide' });
    }

    try {
      const result = await collaborationService.acceptInvitation(request.user!, params.data.token);
      return reply.status(200).send(result);
    } catch (error) {
      return handleCollaborationError(reply, error);
    }
  };

  app.post('/invitations/:token/accept', { preHandler: requireAuth }, acceptHandler);
  app.post('/collaborations/invitations/:token/accept', { preHandler: requireAuth }, acceptHandler);

  const declineHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = tokenParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Jeton invalide' });
    }

    try {
      const result = await collaborationService.declineInvitation(request.user!, params.data.token);
      return reply.status(200).send(result);
    } catch (error) {
      return handleCollaborationError(reply, error);
    }
  };

  app.post('/invitations/:token/decline', { preHandler: requireAuth }, declineHandler);
  app.post(
    '/collaborations/invitations/:token/decline',
    { preHandler: requireAuth },
    declineHandler,
  );

  // ==========================================
  // Invitations reçues par l'utilisateur
  // ==========================================

  app.get('/collaborations/invitations', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const result = await collaborationService.getUserInvitations(request.user!);
      return reply.status(200).send(result);
    } catch (error) {
      return handleCollaborationError(reply, error);
    }
  });

  // ==========================================
  // Départ volontaire (FR-005 & FR-005a)
  // ==========================================

  const leaveHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = leaveParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Paramètres invalides' });
    }

    try {
      const result = await collaborationService.leaveCollaboration(
        request.user!,
        params.data.resourceType,
        params.data.resourceId,
      );
      return reply.status(200).send(result);
    } catch (error) {
      return handleCollaborationError(reply, error);
    }
  };

  app.delete(
    '/collaborations/:resourceType/:resourceId/leave',
    { preHandler: requireAuth },
    leaveHandler,
  );
  app.post(
    '/collaborations/:resourceType/:resourceId/leave',
    { preHandler: requireAuth },
    leaveHandler,
  );

  // ==========================================
  // Consulter les œuvres partagées ("Partagés avec moi" - US2)
  // ==========================================

  app.get('/collaborations/shared-with-me', { preHandler: requireAuth }, async (request, reply) => {
    const parseResult = sharedWithMeQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: 'Paramètres de recherche invalides',
        errors: parseResult.error.flatten(),
      });
    }

    try {
      const result = await collaborationService.getSharedWithMe(request.user!, parseResult.data);
      return reply.status(200).send(result);
    } catch (error) {
      return handleCollaborationError(reply, error);
    }
  });
};
