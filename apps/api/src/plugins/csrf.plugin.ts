import type { FastifyReply, FastifyRequest } from 'fastify';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '').toLowerCase();
}

/**
 * Origines autorisées à l'écriture (état), dérivées de `CLIENT_URL`.
 * Plusieurs origines peuvent être séparées par des virgules.
 */
export function getAllowedOrigins(): string[] {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return clientUrl
    .split(',')
    .map(normalizeOrigin)
    .filter((origin) => origin.length > 0);
}

/**
 * Protection CSRF par validation stricte de l'origine (OWASP :
 * « Verify Origin with Standard Headers »). Sur toute méthode modifiant l'état,
 * une origine (ou à défaut un référent) de navigateur étrangère est refusée.
 *
 * Les clients non-navigateur (tests `app.inject`, appels serveur à serveur)
 * n'envoient ni `Origin` ni `Referer` : ils ne peuvent pas rejouer un cookie
 * ambiant et sont donc laissés passer. C'est précisément le vecteur des
 * attaques CSRF que cette protection neutralise, en complément des cookies
 * `SameSite=Lax` et du CORS restrictif.
 *
 * Ce hook est destiné à être posé à la racine (`app.addHook`) afin d'englober
 * l'ensemble des routes sans créer de contexte d'encapsulation.
 */
export async function csrfGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (SAFE_METHODS.has(request.method)) {
    return;
  }

  const allowedOrigins = getAllowedOrigins();
  const { origin, referer } = request.headers;

  if (origin) {
    if (!allowedOrigins.includes(normalizeOrigin(origin))) {
      return reply.status(403).send({
        message: 'Requête refusée : origine non autorisée',
      });
    }
    return;
  }

  if (referer) {
    let refererOrigin: string;
    try {
      refererOrigin = normalizeOrigin(new URL(referer).origin);
    } catch {
      return reply.status(403).send({
        message: 'Requête refusée : référent invalide',
      });
    }
    if (!allowedOrigins.includes(refererOrigin)) {
      return reply.status(403).send({
        message: 'Requête refusée : origine non autorisée',
      });
    }
  }
}
