import { FastifyReply, FastifyRequest } from 'fastify';
import { Session, User } from '@prisma/client';
import { clearSessionCookie, validateSession, SESSION_COOKIE_NAME } from './session.service.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    session?: Session;
  }
}

/**
 * Garde Fastify exigeant une session valide. Renseigne `request.user` et `request.session`.
 * Répond 401 (et nettoie le cookie) si la session est absente, invalide ou expirée.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const sessionId = request.cookies[SESSION_COOKIE_NAME];
  if (!sessionId) {
    reply.status(401).send({ message: 'Non authentifié' });
    return;
  }

  const result = await validateSession(sessionId);
  if (!result) {
    clearSessionCookie(reply);
    reply.status(401).send({ message: 'Session invalide ou expirée' });
    return;
  }

  request.user = result.user;
  request.session = result.session;
}
