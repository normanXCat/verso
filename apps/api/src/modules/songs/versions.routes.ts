import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { songIdParamSchema, versionIdParamSchema } from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import { listVersions, restoreVersion } from './versions.service.js';

/**
 * Routes de l'historique immuable des versions d'un texte.
 * Monté sous `/api/songs` : `GET /:id/versions` et `POST /:id/versions/:versionId/restore`.
 */
export const versionsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Historique complet des versions (conservé indéfiniment)
  app.get('/:id/versions', { preHandler: requireAuth }, async (request, reply) => {
    const params = songIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant de texte invalide' });
    }

    const versions = await listVersions(request.user!.id, params.data.id);
    if (!versions) {
      return reply.status(404).send({ message: 'Texte introuvable' });
    }
    return reply.status(200).send(versions);
  });

  // Restauration d'une version antérieure sans écraser l'historique
  app.post(
    '/:id/versions/:versionId/restore',
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = versionIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiants invalides' });
      }

      const restored = await restoreVersion(
        request.user!.id,
        params.data.id,
        params.data.versionId,
      );
      if (!restored) {
        return reply.status(404).send({ message: 'Version introuvable' });
      }
      return reply.status(200).send(restored);
    },
  );
};
