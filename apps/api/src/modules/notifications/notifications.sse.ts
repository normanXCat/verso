import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ServerResponse } from 'node:http';
import { notificationsRepository } from './notifications.repository.js';

interface SSEClient {
  response: ServerResponse;
  heartbeatTimer: NodeJS.Timeout;
}

const activeClients = new Map<string, Set<SSEClient>>();

export const notificationsSSE = {
  /**
   * Enregistrer un client SSE sur GET /api/notifications/stream
   */
  async registerClient(userId: string, request: FastifyRequest, reply: FastifyReply) {
    // Configuration des en-têtes SSE
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    reply.raw.flushHeaders?.();

    // Ping initial
    reply.raw.write(': ping\n\n');

    // Envoyer le compteur d'alertes non lues immédiatement à la connexion
    try {
      const count = await notificationsRepository.countUnread(userId);
      reply.raw.write(`event: unread_count\ndata: ${JSON.stringify({ count })}\n\n`);
    } catch {
      // Ignore si la requête est annulée prématurément
    }

    // Heartbeat périodique (25 secondes) pour maintenir les connexions à travers les proxys
    const heartbeatTimer = setInterval(() => {
      try {
        if (!reply.raw.writableEnded) {
          reply.raw.write(': ping\n\n');
        }
      } catch {
        clearInterval(heartbeatTimer);
      }
    }, 25_000);

    const client: SSEClient = {
      response: reply.raw,
      heartbeatTimer,
    };

    let userClients = activeClients.get(userId);
    if (!userClients) {
      userClients = new Set();
      activeClients.set(userId, userClients);
    }
    userClients.add(client);

    const cleanup = () => {
      clearInterval(heartbeatTimer);
      const set = activeClients.get(userId);
      if (set) {
        set.delete(client);
        if (set.size === 0) {
          activeClients.delete(userId);
        }
      }
    };

    request.raw.on('close', cleanup);
    reply.raw.on('close', cleanup);
    reply.raw.on('error', cleanup);
  },

  /**
   * Émettre un événement à tous les flux actifs d'un utilisateur
   */
  sendEventToUser(userId: string, event: string, data: unknown): boolean {
    const clients = activeClients.get(userId);
    if (!clients || clients.size === 0) {
      return false;
    }

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const client of clients) {
      try {
        if (!client.response.writableEnded) {
          client.response.write(payload);
        }
      } catch {
        // En cas d'erreur sur un socket mort
        clearInterval(client.heartbeatTimer);
        clients.delete(client);
      }
    }

    return true;
  },

  /**
   * Envoyer une mise à jour du compteur de non-lus
   */
  sendUnreadCount(userId: string, count: number): void {
    this.sendEventToUser(userId, 'unread_count', { count });
  },

  /**
   * Nombre de connexions SSE actives (utilisé pour les tests / monitoring)
   */
  getConnectionCount(userId?: string): number {
    if (userId) {
      return activeClients.get(userId)?.size ?? 0;
    }
    let total = 0;
    for (const set of activeClients.values()) {
      total += set.size;
    }
    return total;
  },

  /**
   * Fermer toutes les connexions actives (pour les tests / teardown)
   */
  closeAll(): void {
    for (const [, clients] of activeClients) {
      for (const client of clients) {
        clearInterval(client.heartbeatTimer);
        try {
          if (!client.response.writableEnded) {
            client.response.end();
          }
        } catch {
          // Ignore
        }
      }
    }
    activeClients.clear();
  },
};
