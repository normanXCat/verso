import { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import {
  SHARE_RATE_LIMIT_MAX,
  SHARE_RATE_LIMIT_WINDOW,
  createShareLinkSchema,
  publicShareTokenParamSchema,
  shareLinkParamSchema,
  songIdParamSchema,
} from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import {
  ShareServiceError,
  createShareLink,
  getPublicSharedSong,
  listShareLinks,
  revokeShareLink,
} from './shares.service.js';

function handleShareServiceError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof ShareServiceError) {
    if (error.code === 'song_not_found') {
      return reply.status(404).send({ message: 'Texte introuvable' });
    }
    return reply.status(404).send({ message: 'Lien de partage introuvable' });
  }
  throw error;
}

/**
 * Routes d'administration des liens de partage privés (auteur authentifié).
 * Monté sous `/api/songs` :
 *  - `GET    /:id/share-links`
 *  - `POST   /:id/share-links`
 *  - `DELETE /:id/share-links/:linkId`
 */
export const sharesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Liste des liens existants d'un texte
  app.get('/:id/share-links', { preHandler: requireAuth }, async (request, reply) => {
    const params = songIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant de texte invalide' });
    }

    const links = await listShareLinks(request.user!.id, params.data.id);
    if (!links) {
      return reply.status(404).send({ message: 'Texte introuvable' });
    }
    return reply.status(200).send(links);
  });

  // Création d'un lien de partage privé (expiration optionnelle)
  app.post('/:id/share-links', { preHandler: requireAuth }, async (request, reply) => {
    const params = songIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant de texte invalide' });
    }

    const parseResult = createShareLinkSchema.safeParse(request.body ?? {});
    if (!parseResult.success) {
      return reply.status(400).send({
        message: 'Paramètres de partage invalides',
        errors: parseResult.error.flatten(),
      });
    }

    try {
      const link = await createShareLink(request.user!.id, params.data.id, parseResult.data);
      return reply.status(201).send(link);
    } catch (error) {
      return handleShareServiceError(reply, error);
    }
  });

  // Révocation immédiate d'un lien
  app.delete('/:id/share-links/:linkId', { preHandler: requireAuth }, async (request, reply) => {
    const params = shareLinkParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiants invalides' });
    }

    const revoked = await revokeShareLink(request.user!.id, params.data.id, params.data.linkId);
    if (!revoked) {
      return reply.status(404).send({ message: 'Lien de partage introuvable' });
    }
    return reply.status(204).send();
  });
};

/**
 * Route publique de consultation anonyme d'un texte partagé.
 * Montée sous `/api/public`, protégée par un rate limiting strict par IP (FR-044).
 */
export const publicSharesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get(
    '/shares/:token',
    {
      config: {
        rateLimit: {
          max: SHARE_RATE_LIMIT_MAX,
          timeWindow: SHARE_RATE_LIMIT_WINDOW,
        },
      },
    },
    async (request, reply) => {
      const params = publicShareTokenParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(404).send({ message: "Ce lien n'est plus actif" });
      }

      const shared = await getPublicSharedSong(params.data.token);
      if (!shared) {
        return reply.status(404).send({ message: "Ce lien n'est plus actif" });
      }
      return reply.status(200).send(shared);
    },
  );
};
