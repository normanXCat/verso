import crypto from 'node:crypto';
import { FastifyReply } from 'fastify';
import { Session, User } from '@prisma/client';
import { SessionInfo } from '@verso/shared';
import { prisma } from '../../config/prisma.js';

export const SESSION_COOKIE_NAME = 'session_id';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface CreateSessionOptions {
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  rememberMe?: boolean;
}

/**
 * Crée une session sécurisée en base PostgreSQL avec un identifiant de session à haute entropie.
 */
export async function createSession(options: CreateSessionOptions): Promise<Session> {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const duration = options.rememberMe ? THIRTY_DAYS_MS : ONE_DAY_MS;
  const expiresAt = new Date(Date.now() + duration);

  return prisma.session.create({
    data: {
      id: sessionId,
      userId: options.userId,
      userAgent: options.userAgent ?? null,
      ipAddress: options.ipAddress ?? null,
      expiresAt,
    },
  });
}

/**
 * Valide une session en base et renvoie la session avec l'utilisateur associé.
 * Si la session est expirée, elle est automatiquement supprimée.
 */
export async function validateSession(
  sessionId: string,
): Promise<{ session: Session; user: User } | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Vérification de la date d'expiration
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => null);
    return null;
  }

  // Mise à jour de lastActiveAt si plus de 5 minutes se sont écoulées
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (session.lastActiveAt < fiveMinutesAgo) {
    await prisma.session
      .update({
        where: { id: sessionId },
        data: { lastActiveAt: new Date() },
      })
      .catch(() => null);
  }

  return { session, user: session.user };
}

/**
 * Supprime une session active (déconnexion).
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => null);
}

/**
 * Révoque toutes les sessions d'un utilisateur, avec option d'exclure la session courante.
 */
export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string,
): Promise<void> {
  if (exceptSessionId) {
    await prisma.session.deleteMany({
      where: {
        userId,
        id: { not: exceptSessionId },
      },
    });
  } else {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
}

/**
 * Liste les sessions actives d'un utilisateur en masquant les données sensibles.
 */
export async function listUserSessions(
  userId: string,
  currentSessionId?: string,
): Promise<SessionInfo[]> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActiveAt: 'desc' },
  });

  return sessions.map((s) => ({
    id: s.id,
    isCurrent: s.id === currentSessionId,
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    createdAt: s.createdAt,
    lastActiveAt: s.lastActiveAt,
  }));
}

/**
 * Positionne le cookie de session HttpOnly / Secure / SameSite=Lax.
 */
export function setSessionCookie(
  reply: FastifyReply,
  sessionId: string,
  rememberMe: boolean = false,
): void {
  reply.setCookie(SESSION_COOKIE_NAME, sessionId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 } : {}),
  });
}

/**
 * Supprime le cookie de session du client.
 */
export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}
