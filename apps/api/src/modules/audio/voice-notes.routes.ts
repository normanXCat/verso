import { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import {
  confirmVoiceNoteSchema,
  songIdParamSchema,
  voiceNoteIdParamSchema,
  voiceNoteUploadUrlSchema,
} from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import {
  VoiceNoteServiceError,
  confirmVoiceNote,
  createVoiceUploadUrl,
  deleteVoiceNote,
  listSongVoiceNotes,
} from './voice-notes.service.js';

function handleServiceError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof VoiceNoteServiceError) {
    if (error.code === 'song_not_found') {
      return reply.status(404).send({ message: 'Texte introuvable' });
    }
    return reply.status(404).send({ message: 'Mémo vocal introuvable' });
  }
  throw error;
}

/**
 * Routes des mémos vocaux (freestyle) — FR-048.
 * Monté sous `/api` :
 *  - `POST   /songs/:id/voice-notes/upload-url`
 *  - `POST   /songs/:id/voice-notes/confirm`
 *  - `GET    /songs/:id/voice-notes`
 *  - `DELETE /voice-notes/:id`
 */
export const voiceNotesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // URL présignée de téléversement d'un enregistrement MediaRecorder
  app.post(
    '/songs/:id/voice-notes/upload-url',
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = songIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiant de texte invalide' });
      }

      const parseResult = voiceNoteUploadUrlSchema.safeParse(request.body ?? {});
      if (!parseResult.success) {
        return reply.status(400).send({
          message: 'Demande de téléversement invalide',
          errors: parseResult.error.flatten(),
        });
      }

      try {
        const result = await createVoiceUploadUrl(
          request.user!.id,
          params.data.id,
          parseResult.data,
        );
        return reply.status(200).send(result);
      } catch (error) {
        return handleServiceError(reply, error);
      }
    },
  );

  // Confirmation du téléversement et enregistrement du mémo vocal
  app.post(
    '/songs/:id/voice-notes/confirm',
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = songIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ message: 'Identifiant de texte invalide' });
      }

      const parseResult = confirmVoiceNoteSchema.safeParse(request.body ?? {});
      if (!parseResult.success) {
        return reply.status(400).send({
          message: 'Confirmation de téléversement invalide',
          errors: parseResult.error.flatten(),
        });
      }

      try {
        const voiceNote = await confirmVoiceNote(
          request.user!.id,
          params.data.id,
          parseResult.data,
        );
        return reply.status(201).send(voiceNote);
      } catch (error) {
        return handleServiceError(reply, error);
      }
    },
  );

  // Liste des mémos vocaux d'un texte avec URL de lecture signée
  app.get('/songs/:id/voice-notes', { preHandler: requireAuth }, async (request, reply) => {
    const params = songIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant de texte invalide' });
    }

    try {
      const voiceNotes = await listSongVoiceNotes(request.user!.id, params.data.id);
      return reply.status(200).send(voiceNotes);
    } catch (error) {
      return handleServiceError(reply, error);
    }
  });

  // Suppression d'un mémo vocal (base puis objet S3)
  app.delete('/voice-notes/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = voiceNoteIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant de mémo vocal invalide' });
    }

    const deleted = await deleteVoiceNote(request.user!.id, params.data.id);
    if (!deleted) {
      return reply.status(404).send({ message: 'Mémo vocal introuvable' });
    }
    return reply.status(204).send();
  });
};
