import Fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

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

  // Limitation de débit par défaut
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Routes d'authentification et de sessions
  const { authRoutes } = await import('./modules/auth/auth.routes.js');
  await app.register(authRoutes, { prefix: '/api/auth' });

  // Routes OAuth (Google & ORCID)
  const { oauthRoutes } = await import('./modules/auth/oauth.routes.js');
  await app.register(oauthRoutes, { prefix: '/api/auth/oauth' });

  // Route de contrôle de santé
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'verso-api',
    };
  });

  return app;
}
