import Fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  // Sécurité des en-têtes HTTP
  await app.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
  });

  // Support des cookies HttpOnly sécurisés
  await app.register(cookie, {
    secret:
      process.env.SESSION_SECRET || 'dev_cookie_secret_at_least_32_characters_long_for_security',
  });

  // CORS restrictif
  await app.register(cors, {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Support des WebSockets
  await app.register(websocket);

  // Limitation de débit par défaut
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Gestionnaire d'erreurs global (message générique + identifiant de requête)
  const { globalErrorHandler } = await import('./plugins/error-handler.js');
  app.setErrorHandler(globalErrorHandler);

  // Protection CSRF : validation stricte de l'origine des requêtes modifiant l'état
  // (hook posé à la racine pour englober toutes les routes sans encapsulation)
  const { csrfGuard } = await import('./plugins/csrf.plugin.js');
  app.addHook('onRequest', csrfGuard);

  // Parseur JSON tolérant aux corps vides sur les routes déclarées `allowEmptyBody`
  const { registerEmptyBodyParser } = await import('./plugins/empty-body-parser.js');
  registerEmptyBodyParser(app);

  // Stockage d'objets compatible S3 (URLs présignées)
  const { s3Plugin } = await import('./plugins/s3.plugin.js');
  await app.register(s3Plugin);

  // Routes d'authentification et de sessions
  const { authRoutes } = await import('./modules/auth/auth.routes.js');
  await app.register(authRoutes, { prefix: '/api/auth' });

  // Routes OAuth (Google & ORCID)
  const { oauthRoutes } = await import('./modules/auth/oauth.routes.js');
  await app.register(oauthRoutes, { prefix: '/api/auth/oauth' });

  // Routes de l'espace personnel (recherche et filtres des textes)
  const { songsRoutes } = await import('./modules/songs/songs.routes.js');
  await app.register(songsRoutes, { prefix: '/api/songs' });

  // Routes de l'historique des versions des textes
  const { versionsRoutes } = await import('./modules/songs/versions.routes.js');
  await app.register(versionsRoutes, { prefix: '/api/songs' });

  // Routes des liens de partage privés (administration par l'auteur)
  const { sharesRoutes } = await import('./modules/songs/shares.routes.js');
  await app.register(sharesRoutes, { prefix: '/api/songs' });

  // Route publique de consultation d'un texte partagé (rate limit strict)
  const { publicSharesRoutes } = await import('./modules/songs/shares.routes.js');
  await app.register(publicSharesRoutes, { prefix: '/api/public' });

  // Routes des albums et de leurs tracklists
  const { albumsRoutes } = await import('./modules/albums/albums.routes.js');
  await app.register(albumsRoutes, { prefix: '/api/albums' });

  // Routes des instrumentales (upload présigné, lecture, quotas)
  const { audioRoutes } = await import('./modules/audio/audio.routes.js');
  await app.register(audioRoutes, { prefix: '/api' });

  // Routes des mémos vocaux freestyle (upload présigné, lecture, suppression)
  const { voiceNotesRoutes } = await import('./modules/audio/voice-notes.routes.js');
  await app.register(voiceNotesRoutes, { prefix: '/api' });

  // Routes de collaboration, invitations et partages
  const { collaborationRoutes } = await import('./modules/collaboration/collaboration.routes.js');
  await app.register(collaborationRoutes, { prefix: '/api' });

  // Routes des commentaires, discussions et fils ancrés
  const { commentsRoutes } = await import('./modules/comments/comments.routes.js');
  await app.register(commentsRoutes, { prefix: '/api' });

  // Routes des notifications, alertes in-app, flux SSE et préférences
  const { notificationsRoutes } = await import('./modules/notifications/notifications.routes.js');
  await app.register(notificationsRoutes, { prefix: '/api' });

  // Routes des crédits artistiques et quote-parts
  const { creditsRoutes } = await import('./modules/credits/credits.routes.js');
  await app.register(creditsRoutes, { prefix: '/api' });

  // Routes de modération, profils minimaux, blocages et signalements
  const { moderationRoutes } = await import('./modules/moderation/moderation.routes.js');
  await app.register(moderationRoutes, { prefix: '/api' });

  // Routes de synchronisation temps réel Yjs, présence et sessions studio
  const { realtimeRoutes } = await import('./modules/realtime/realtime.ws.js');
  await app.register(realtimeRoutes, { prefix: '/api/realtime' });

  // Atelier de prévisualisation des emails transactionnels (développement uniquement)
  if (process.env.NODE_ENV !== 'production') {
    const { emailPreviewRoutes } = await import('./modules/dev/email-preview.routes.js');
    await app.register(emailPreviewRoutes);
  }

  // Contrôle de santé : vérifie explicitement la connexion à la base de données.
  app.get('/health', async (request, reply) => {
    const { checkDatabaseConnection } = await import('./config/prisma.js');
    try {
      await checkDatabaseConnection();
      return reply.status(200).send({
        status: 'ok',
        database: 'up',
        timestamp: new Date().toISOString(),
        service: 'verso-api',
      });
    } catch (error) {
      request.log.error({ err: error }, 'Healthcheck : base de données injoignable');
      return reply.status(503).send({
        status: 'error',
        database: 'down',
        timestamp: new Date().toISOString(),
        service: 'verso-api',
      });
    }
  });

  return app;
}
