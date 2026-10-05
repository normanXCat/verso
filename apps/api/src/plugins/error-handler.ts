import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

const SECRET_PATTERN =
  /(password|passwd|pwd|token|secret|api[_-]?key|authorization|bearer|cookie)(\s*[:=]\s*|\s+)([^\s,;"'}\]]+)/gi;

/** Masque toute valeur ressemblant à un secret avant journalisation. */
export function redactSecrets(input: string): string {
  return input.replace(SECRET_PATTERN, (_match, key: string) => `${key}=[REDACTED]`);
}

function isInfrastructureError(error: FastifyError): boolean {
  const name = error.name ?? '';
  const message = error.message ?? '';
  return (
    name.startsWith('PrismaClient') ||
    /database server|can'?t reach database|ECONNREFUSED|connection refused/i.test(message)
  );
}

/**
 * Gestionnaire d'erreurs global.
 * - Journalise l'erreur complète côté serveur (messages et pile masqués des secrets).
 * - Renvoie au client un message générique et un identifiant de requête.
 * - N'expose jamais la pile d'appels ni les détails internes.
 */
export function globalErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  const requestId = String(request.id);
  const statusCode =
    typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 600
      ? error.statusCode
      : 500;

  const infrastructure = isInfrastructureError(error);
  const finalStatus = infrastructure ? 503 : statusCode;

  request.log.error(
    {
      requestId,
      method: request.method,
      url: request.url,
      err: {
        name: error.name,
        code: error.code,
        message: redactSecrets(error.message ?? ''),
        stack: error.stack ? redactSecrets(error.stack) : undefined,
      },
    },
    'Erreur non gérée interceptée par le gestionnaire global',
  );

  reply.header('x-request-id', requestId);

  if (error.validation) {
    return reply.status(400).send({
      message: 'Requête invalide',
      requestId,
    });
  }

  const clientMessage =
    finalStatus >= 500
      ? 'Un problème est survenu de notre côté. Réessayez dans un instant.'
      : error.message || 'Requête invalide';

  return reply.status(finalStatus).send({ message: clientMessage, requestId });
}
