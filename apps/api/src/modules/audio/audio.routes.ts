import { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import {
  instrumentalIdParamSchema,
  updateInstrumentalSchema,
  songIdParamSchema,
  uploadUrlSchema,
  confirmInstrumentalSchema,
} from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import {
  AudioServiceError,
  confirmInstrumental,
  createUploadUrl,
  deleteInstrumental,
  listSongInstrumentals,
  updateInstrumental,
} from './audio.service.js';

function handleServiceError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof AudioServiceError) {
    if (error.code === 'quota_exceeded') {
      return reply.status(409).send({ message: 'Quota maximum de 3 instrumentales atteint' });
    }
    if (error.code === 'instrumental_not_found') {
      return reply.status(404).send({ message: 'Instrumentale introuvable' });
    }
    return reply.status(404).send({ message: 'Texte introuvable' });
  }
  throw error;
}

/**
 * Routes de gestion des instrumentales (module audio).
 * Monté sous `/api` :
 *  - `POST /songs/:id/instrumentals/upload-url`
 *  - `POST /songs/:id/instrumentals/confirm`
 *  - `GET /songs/:id/instrumentals`
 *  - `PATCH /instrumentals/:id`
 *  - `DELETE /instrumentals/:id`
 */
export const audioRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Génération d'une URL présignée de téléversement (quota et cloisonnement vérifiés)
  app.post(
    '/songs/:id/instrumentals/upload-url',
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = songIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiant de texte invalide' });
      }

      const parseResult = uploadUrlSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          message: 'Demande de téléversement invalide',
          errors: parseResult.error.flatten(),
        });
      }

      try {
        const result = await createUploadUrl(request.user!.id, params.data.id, parseResult.data);
        return reply.status(200).send(result);
      } catch (error) {
        return handleServiceError(reply, error);
      }
    },
  );

  // Confirmation du téléversement et enregistrement en base
  app.post(
    '/songs/:id/instrumentals/confirm',
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = songIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiant de texte invalide' });
      }

      const parseResult = confirmInstrumentalSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          message: 'Confirmation de téléversement invalide',
          errors: parseResult.error.flatten(),
        });
      }

      try {
        const instrumental = await confirmInstrumental(
          request.user!.id,
          params.data.id,
          parseResult.data,
        );
        return reply.status(201).send(instrumental);
      } catch (error) {
        return handleServiceError(reply, error);
      }
    },
  );

  // Liste des instrumentales d'un texte avec URL de lecture signée
  app.get('/songs/:id/instrumentals', { preHandler: requireAuth }, async (request, reply) => {
    const params = songIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant de texte invalide' });
    }

    try {
      const instrumentals = await listSongInstrumentals(request.user!.id, params.data.id);
      return reply.status(200).send(instrumentals);
    } catch (error) {
      return handleServiceError(reply, error);
    }
  });

  // Mise à jour des métadonnées ou bascule de la piste active
  app.patch('/instrumentals/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = instrumentalIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: "Identifiant d'instrumentale invalide" });
    }

    const parseResult = updateInstrumentalSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: "Données d'instrumentale invalides",
        errors: parseResult.error.flatten(),
      });
    }

    const updated = await updateInstrumental(request.user!.id, params.data.id, parseResult.data);
    if (!updated) {
      return reply.status(404).send({ message: 'Instrumentale introuvable' });
    }
    return reply.status(200).send(updated);
  });

  // Suppression d'une instrumentale (base puis objet S3)
  app.delete('/instrumentals/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = instrumentalIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: "Identifiant d'instrumentale invalide" });
    }

    const deleted = await deleteInstrumental(request.user!.id, params.data.id);
    if (!deleted) {
      return reply.status(404).send({ message: 'Instrumentale introuvable' });
    }
    return reply.status(204).send();
  });
};
