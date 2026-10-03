import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { searchSongsQuerySchema } from '@verso/shared';
import { requireAuth } from '../auth/auth.guard.js';
import { searchSongs } from './songs.repository.js';

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
};
