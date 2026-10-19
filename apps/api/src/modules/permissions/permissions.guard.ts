import type { FastifyReply, FastifyRequest } from 'fastify';
import { can } from './permissions.service.js';
import type { PermissionAction, ResourceTarget } from './permissions.types.js';

export const NOT_FOUND_RESPONSE = { message: 'Ressource introuvable' };

/**
 * Garde Fastify vérifiant les autorisations via la fonction centrale can().
 * En cas d'accès refusé ou de ressource absente, renvoie systématiquement
 * une réponse HTTP 404 neutre afin d'interdire toute fuite d'existence (FR-004).
 */
export function requirePermission(
  resourceType: 'song' | 'album' | 'comment' | 'invitation',
  action: PermissionAction,
  idParam = 'id',
) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user;
    if (!user) {
      reply.status(401).send({ message: 'Non authentifié' });
      return;
    }

    const params = request.params as Record<string, string> | undefined;
    const resourceId = params?.[idParam];

    if (!resourceId) {
      reply.status(404).send(NOT_FOUND_RESPONSE);
      return;
    }

    const target: ResourceTarget = {
      type: resourceType,
      id: resourceId,
    } as ResourceTarget;

    const allowed = await can(user, target, action);
    if (!allowed) {
      reply.status(404).send(NOT_FOUND_RESPONSE);
      return;
    }
  };
}
