import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  createSongSchema,
  searchSongsQuerySchema,
  songIdParamSchema,
  updateSongSchema,
} from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import { searchSongs } from './songs.repository.js';
import { SongServiceError, createSong, deleteSong, getSong, updateSong } from './songs.service.js';

export const songsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Recherche plein texte et filtres combinables de l'espace personnel
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const parseResult = searchSongsQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: 'Paramètres de recherche invalides',
        errors: parseResult.error.flatten(),
      });
    }

    const user = request.user!;
    const query = parseResult.data;
    const { items, total } = await searchSongs(user.id, query);

    return reply.status(200).send({
      items,
      total,
      query: query.q,
      filter: query.filter,
      sort: query.sort,
      limit: query.limit,
      offset: query.offset,
    });
  });

  // Création d'un texte
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const parseResult = createSongSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: 'Données de texte invalides',
        errors: parseResult.error.flatten(),
      });
    }

    try {
      const item = await createSong(request.user!.id, parseResult.data);
      return reply.status(201).send(item);
    } catch (error) {
      if (error instanceof SongServiceError) {
        return reply.status(400).send({ message: 'Album introuvable' });
      }
      throw error;
    }
  });

  // Lecture d'un texte
  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = songIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant de texte invalide' });
    }

    const item = await getSong(request.user!.id, params.data.id);
    if (!item) {
      return reply.status(404).send({ message: 'Texte introuvable' });
    }
    return reply.status(200).send(item);
  });

  // Mise à jour (sauvegarde automatique, statut, favori, tags)
  app.patch('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = songIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant de texte invalide' });
    }

    const parseResult = updateSongSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: 'Données de texte invalides',
        errors: parseResult.error.flatten(),
      });
    }

    try {
      const item = await updateSong(request.user!.id, params.data.id, parseResult.data);
      if (!item) {
        return reply.status(404).send({ message: 'Texte introuvable' });
      }
      return reply.status(200).send(item);
    } catch (error) {
      if (error instanceof SongServiceError) {
        return reply.status(400).send({ message: 'Album introuvable' });
      }
      throw error;
    }
  });

  // Suppression d'un texte
  app.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = songIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiant de texte invalide' });
    }

    const deleted = await deleteSong(request.user!.id, params.data.id);
    if (!deleted) {
      return reply.status(404).send({ message: 'Texte introuvable' });
    }
    return reply.status(204).send();
  });
};
