import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type WebSocket from 'ws';
import * as Y from 'yjs';
import { prisma } from '../../config/prisma.js';
import { evaluateSongAction } from '../permissions/permissions.service.js';
import { realtimePersistence, type ParticipantInfo } from './realtime.persistence.js';

const USER_COLORS = [
  '#3b82f6', // bleu
  '#10b981', // émeraude
  '#f59e0b', // ambre
  '#ec4899', // rose
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // turquoise
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function broadcastToOthers(
  subscribers: Map<unknown, ParticipantInfo>,
  senderSocket: WebSocket,
  message: object,
) {
  const json = JSON.stringify(message);
  for (const [subSocket] of subscribers) {
    const ws = subSocket as WebSocket;
    if (ws !== senderSocket && ws.readyState === ws.OPEN) {
      ws.send(json);
    }
  }
}

export const realtimeRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get<{ Params: { songId: string } }>(
    '/songs/:songId',
    { websocket: true },
    async (socket: WebSocket, request) => {
      const { songId } = request.params;

      // 1. Authentification via session_id (cookie ou query string pour les tests)
      const query = request.query as Record<string, string | undefined>;
      const sessionId = request.cookies.session_id || query?.token || query?.session_id;

      if (!sessionId) {
        socket.close(4401, 'Non authentifié');
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (!session || session.expiresAt <= new Date()) {
        socket.close(4401, 'Session expirée ou invalide');
        return;
      }

      // 2. Contrôle d'accès au texte (Zéro fuite d'existence : 4404)
      const song = await prisma.song.findUnique({
        where: { id: songId },
        include: {
          collaborators: true,
          album: {
            include: {
              collaborators: true,
            },
          },
        },
      });

      if (!song) {
        socket.close(4404, 'Ressource introuvable');
        return;
      }

      const hasAccess = evaluateSongAction(session.userId, song, 'read');
      if (!hasAccess) {
        socket.close(4404, 'Ressource introuvable');
        return;
      }

      // 3. Initialisation du salon et de l'utilisateur
      const room = realtimePersistence.getOrCreateRoom(song.id, song.content);
      const colorIndex = Math.abs(hashString(session.userId)) % USER_COLORS.length;
      const participantInfo: ParticipantInfo = {
        userId: session.userId,
        displayName: session.user.displayName || 'Artiste Verso',
        avatarUrl: session.user.avatarUrl,
        color: USER_COLORS[colorIndex],
      };

      room.subscribers.set(socket, participantInfo);

      // 4. Envoi de l'état initial au client connecté
      const stateUpdate = Array.from(Y.encodeStateAsUpdate(room.doc));
      socket.send(
        JSON.stringify({
          type: 'sync',
          payload: stateUpdate,
        }),
      );

      socket.send(
        JSON.stringify({
          type: 'presence',
          participants: Array.from(room.subscribers.values()),
        }),
      );

      // 5. Annonce de l'arrivée aux autres participants
      broadcastToOthers(room.subscribers, socket, {
        type: 'user_joined',
        user: participantInfo,
      });

      // 6. Gestion des messages entrants
      socket.on('message', (data: Buffer | string) => {
        try {
          const parsed = JSON.parse(data.toString());

          switch (parsed.type) {
            case 'sync': {
              if (Array.isArray(parsed.payload)) {
                Y.applyUpdate(room.doc, new Uint8Array(parsed.payload));
                realtimePersistence.scheduleSave(song.id);
                broadcastToOthers(room.subscribers, socket, {
                  type: 'sync',
                  payload: parsed.payload,
                });
              }
              break;
            }

            case 'cursor': {
              broadcastToOthers(room.subscribers, socket, {
                type: 'cursor',
                userId: session.userId,
                cursor: parsed.cursor,
              });
              break;
            }

            case 'studio:transport': {
              broadcastToOthers(room.subscribers, socket, {
                type: 'studio:transport',
                actorId: session.userId,
                action: parsed.action,
                position: parsed.position,
                timestamp: parsed.timestamp || Date.now(),
                bpm: parsed.bpm,
              });
              break;
            }

            case 'studio:metronome': {
              broadcastToOthers(room.subscribers, socket, {
                type: 'studio:metronome',
                actorId: session.userId,
                isEnabled: parsed.isEnabled,
                bpm: parsed.bpm,
              });
              break;
            }
          }
        } catch {
          // Message malformé ignoré
        }
      });

      // 7. Déconnexion
      socket.on('close', async () => {
        await realtimePersistence.removeSubscriber(song.id, socket);
        broadcastToOthers(room.subscribers, socket, {
          type: 'user_left',
          userId: session.userId,
        });
      });
    },
  );
};
