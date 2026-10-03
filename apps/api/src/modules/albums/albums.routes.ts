import { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import {
  addTrackSchema,
  albumIdParamSchema,
  albumTrackParamSchema,
  createAlbumSchema,
  reorderTracksSchema,
  updateAlbumSchema,
} from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import {
  AlbumServiceError,
  addTrack,
  createAlbum,
  deleteAlbum,
  getAlbum,
  listUserAlbums,
  removeTrack,
  reorderTracks,
  updateAlbum,
} from './albums.service.js';

function handleServiceError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof AlbumServiceError) {
    if (error.code === 'invalid_tracklist') {
      return reply.status(400).send({ message: 'Tracklist invalide' });
    }
    return reply.status(404).send({ message: 'Ressource introuvable' });
  }
  throw error;
}

export const albumsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Liste des albums de l'utilisateur avec le nombre de pistes
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const albums = await listUserAlbums(request.user!.id);
    return reply.status(200).send(albums);
  });

  // Création d'un album
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const parseResult = createAlbumSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: "Données d'album invalides",
        errors: parseResult.error.flatten(),
      });
    }

    const album = await createAlbum(request.user!.id, parseResult.data);
    return reply.status(201).send(album);
  });

  // Détail d'un album avec sa tracklist ordonnée
  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = albumIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: "Identifiant d'album invalide" });
    }

    const album = await getAlbum(request.user!.id, params.data.id);
    if (!album) {
      return reply.status(404).send({ message: 'Album introuvable' });
    }
    return reply.status(200).send(album);
  });

  // Mise à jour des métadonnées de l'album
  app.put('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = albumIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: "Identifiant d'album invalide" });
    }

    const parseResult = updateAlbumSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: "Données d'album invalides",
        errors: parseResult.error.flatten(),
      });
    }

    const album = await updateAlbum(request.user!.id, params.data.id, parseResult.data);
    if (!album) {
      return reply.status(404).send({ message: 'Album introuvable' });
    }
    return reply.status(200).send(album);
  });

  // Suppression de l'album (détache les textes, ne les supprime jamais)
  app.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = albumIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: "Identifiant d'album invalide" });
    }

    const deleted = await deleteAlbum(request.user!.id, params.data.id);
    if (!deleted) {
      return reply.status(404).send({ message: 'Album introuvable' });
    }
    return reply.status(204).send();
  });

  // Réordonnancement par glisser-déposer de la tracklist
  app.put('/:id/tracks/reorder', { preHandler: requireAuth }, async (request, reply) => {
    const params = albumIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: "Identifiant d'album invalide" });
    }

    const parseResult = reorderTracksSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: 'Tracklist invalide',
        errors: parseResult.error.flatten(),
      });
    }

    try {
      const album = await reorderTracks(request.user!.id, params.data.id, parseResult.data.songIds);
      return reply.status(200).send(album);
    } catch (error) {
      return handleServiceError(reply, error);
    }
  });

  // Ajout d'un texte existant à l'album
  app.post('/:id/tracks', { preHandler: requireAuth }, async (request, reply) => {
    const params = albumIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: "Identifiant d'album invalide" });
    }

    const parseResult = addTrackSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: 'Piste invalide',
        errors: parseResult.error.flatten(),
      });
    }

    try {
      const album = await addTrack(request.user!.id, params.data.id, parseResult.data.songId);
      return reply.status(201).send(album);
    } catch (error) {
      return handleServiceError(reply, error);
    }
  });

  // Retrait d'un texte de l'album sans le supprimer
  app.delete('/:id/tracks/:songId', { preHandler: requireAuth }, async (request, reply) => {
    const params = albumTrackParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ message: 'Identifiants invalides' });
    }

    try {
      await removeTrack(request.user!.id, params.data.id, params.data.songId);
      return reply.status(204).send();
    } catch (error) {
      return handleServiceError(reply, error);
    }
  });
};
