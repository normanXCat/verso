import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import * as Y from 'yjs';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';
import { clearDatabase } from '../helpers/db.js';
import { realtimePersistence } from '../../src/modules/realtime/realtime.persistence.js';

describe("Tests d'intégration : Synchronisation temps réel et session studio (/api/realtime)", () => {
  let app: FastifyInstance;
  let serverPort: number;

  beforeAll(async () => {
    app = await buildApp();
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    serverPort = typeof address === 'object' && address ? address.port : 0;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    realtimePersistence.clearForTesting();
    await clearDatabase();
  });

  async function registerUser(
    email: string,
    displayName?: string,
  ): Promise<{ userId: string; sessionId: string }> {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'Password123!', displayName },
    });
    const sessionId = response.cookies.find((c) => c.name === 'session_id')?.value;
    if (!sessionId) {
      throw new Error("Échec de l'obtention du cookie de session");
    }
    return { userId: response.json().user.id as string, sessionId };
  }

  function expectWsCloseCode(songId: string, sessionId?: string): Promise<number> {
    return new Promise((resolve) => {
      const url = `ws://127.0.0.1:${serverPort}/api/realtime/songs/${songId}${
        sessionId ? `?session_id=${sessionId}` : ''
      }`;
      const ws = new WebSocket(url, {
        headers: sessionId ? { Cookie: `session_id=${sessionId}` } : undefined,
      });

      ws.on('close', (code) => {
        resolve(code);
      });
      ws.on('error', () => {
        // error during handshake is followed by close event
      });
    });
  }

  type WsMsg = Record<string, unknown>;

  interface ManagedWs {
    ws: WebSocket;
    messages: WsMsg[];
    waitForOpen: () => Promise<void>;
    waitForMessage: (predicate: (msg: WsMsg) => boolean, timeoutMs?: number) => Promise<WsMsg>;
    clearMessages: () => void;
  }

  function createManagedWs(songId: string, sessionId: string): ManagedWs {
    const url = `ws://127.0.0.1:${serverPort}/api/realtime/songs/${songId}?session_id=${sessionId}`;
    const ws = new WebSocket(url, {
      headers: { Cookie: `session_id=${sessionId}` },
    });

    const messages: WsMsg[] = [];
    const messageWaiters: Array<{
      predicate: (m: WsMsg) => boolean;
      resolve: (m: WsMsg) => void;
    }> = [];

    let isOpen = false;
    const openWaiters: Array<() => void> = [];

    ws.on('open', () => {
      isOpen = true;
      for (const w of openWaiters) w();
    });

    ws.on('message', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString()) as WsMsg;
        messages.push(parsed);

        for (let i = messageWaiters.length - 1; i >= 0; i--) {
          if (messageWaiters[i].predicate(parsed)) {
            const waiter = messageWaiters.splice(i, 1)[0];
            waiter.resolve(parsed);
          }
        }
      } catch {
        // ignore
      }
    });

    const waitForOpen = (): Promise<void> => {
      if (isOpen) return Promise.resolve();
      return new Promise((resolve) => {
        openWaiters.push(resolve);
      });
    };

    const waitForMessage = (
      predicate: (msg: WsMsg) => boolean,
      timeoutMs = 4000,
    ): Promise<WsMsg> => {
      const existing = messages.find(predicate);
      if (existing) {
        return Promise.resolve(existing);
      }

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(
            new Error(
              `Timeout attente message après ${timeoutMs}ms. Reçus: ${JSON.stringify(messages)}`,
            ),
          );
        }, timeoutMs);

        messageWaiters.push({
          predicate,
          resolve: (msg) => {
            clearTimeout(timer);
            resolve(msg);
          },
        });
      });
    };

    const clearMessages = () => {
      messages.length = 0;
    };

    return { ws, messages, waitForOpen, waitForMessage, clearMessages };
  }

  describe('Authentification et Contrôle d’accès WebSocket (FR-035)', () => {
    it('ferme la connexion avec code 4401 en l’absence de session valide', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice');
      const song = await prisma.song.create({
        data: { title: 'Titre', content: 'Paroles', userId: userA.userId },
      });

      const closeCode = await expectWsCloseCode(song.id, undefined);
      expect(closeCode).toBe(4401);
    });

    it('ferme la connexion avec code 4404 (zéro fuite) si l’utilisateur n’a pas accès au texte', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice');
      const userB = await registerUser('bob@verso.fr', 'Bob');

      const song = await prisma.song.create({
        data: { title: 'Titre Privé', content: 'Paroles', userId: userA.userId },
      });

      // Bob essaie d'accéder au texte d'Alice sans autorisation
      const closeCode = await expectWsCloseCode(song.id, userB.sessionId);
      expect(closeCode).toBe(4404);
    });

    it('établit la connexion pour un co-auteur et transmet l’état initial et la présence', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice Plume');
      const userB = await registerUser('bob@verso.fr', 'Bob Lyricist');

      const song = await prisma.song.create({
        data: { title: 'Titre Partagé', content: 'Couplet 1...', userId: userA.userId },
      });

      await prisma.collaborator.create({
        data: {
          songId: song.id,
          userId: userB.userId,
          invitedById: userA.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
      });

      const client = createManagedWs(song.id, userB.sessionId);
      await client.waitForOpen();

      // Reçoit l'état Yjs initial
      const syncMsg = await client.waitForMessage((m) => m.type === 'sync');
      expect(syncMsg.type).toBe('sync');
      expect(Array.isArray(syncMsg.payload)).toBe(true);

      // Reçoit la liste des présences
      const presenceMsg = await client.waitForMessage((m) => m.type === 'presence');
      expect(
        (presenceMsg.participants as Array<{ userId: string }>).some(
          (p) => p.userId === userB.userId,
        ),
      ).toBe(true);

      client.ws.close();
    });
  });

  describe('Synchronisation collaborative d’écriture et curseurs (FR-035, FR-036)', () => {
    it('relaye les deltas Yjs entre co-auteurs et persiste le texte en base', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice');
      const userB = await registerUser('bob@verso.fr', 'Bob');

      const song = await prisma.song.create({
        data: { title: 'Duo', content: 'Initial', userId: userA.userId },
      });

      await prisma.collaborator.create({
        data: {
          songId: song.id,
          userId: userB.userId,
          invitedById: userA.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
      });

      const clientA = createManagedWs(song.id, userA.sessionId);
      await clientA.waitForOpen();
      await clientA.waitForMessage((m) => m.type === 'sync');

      const clientB = createManagedWs(song.id, userB.sessionId);
      await clientB.waitForOpen();
      await clientB.waitForMessage((m) => m.type === 'sync');
      clientB.clearMessages();

      // Préparer une mise à jour Yjs locale sur le client A
      const clientDocA = new Y.Doc();
      const textA = clientDocA.getText('lyrics');
      let clientUpdate: Uint8Array | null = null;
      clientDocA.on('update', (u: Uint8Array) => {
        clientUpdate = u;
      });
      textA.insert(0, 'Vers écrit par Alice ! ');

      expect(clientUpdate).not.toBeNull();

      // Envoi de la mise à jour par A
      clientA.ws.send(
        JSON.stringify({
          type: 'sync',
          payload: Array.from(clientUpdate!),
        }),
      );

      // B doit recevoir la mise à jour
      const receivedUpdate = await clientB.waitForMessage((m) => m.type === 'sync');
      expect(receivedUpdate.payload).toEqual(Array.from(clientUpdate!));

      // Vérifier la persistance debouncée
      await realtimePersistence.flushSave(song.id);

      const updatedSong = await prisma.song.findUnique({ where: { id: song.id } });
      expect(updatedSong?.content).toContain('Vers écrit par Alice !');

      clientA.ws.close();
      clientB.ws.close();
    });

    it('diffuse les positions de curseur des collaborateurs connectés', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice');
      const userB = await registerUser('bob@verso.fr', 'Bob');

      const song = await prisma.song.create({
        data: { title: 'Curseurs', content: 'Ligne 1\nLigne 2', userId: userA.userId },
      });

      await prisma.collaborator.create({
        data: {
          songId: song.id,
          userId: userB.userId,
          invitedById: userA.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
      });

      const clientA = createManagedWs(song.id, userA.sessionId);
      await clientA.waitForOpen();
      await clientA.waitForMessage((m) => m.type === 'sync');

      const clientB = createManagedWs(song.id, userB.sessionId);
      await clientB.waitForOpen();
      await clientB.waitForMessage((m) => m.type === 'sync');
      clientB.clearMessages();

      // A envoie un déplacement de curseur
      clientA.ws.send(
        JSON.stringify({
          type: 'cursor',
          cursor: { from: 5, to: 10 },
        }),
      );

      // B reçoit le curseur d'A
      const cursorMsg = await clientB.waitForMessage((m) => m.type === 'cursor');
      expect(cursorMsg.userId).toBe(userA.userId);
      expect(cursorMsg.cursor).toEqual({ from: 5, to: 10 });

      clientA.ws.close();
      clientB.ws.close();
    });
  });

  describe('Mode Session Studio : Synchronisation audio et métronome (FR-037)', () => {
    it('synchronise la lecture audio et le BPM du métronome entre les participants', async () => {
      const userA = await registerUser('alice@verso.fr', 'Alice');
      const userB = await registerUser('bob@verso.fr', 'Bob');

      const song = await prisma.song.create({
        data: { title: 'Studio Session', content: 'Track 1', userId: userA.userId },
      });

      await prisma.collaborator.create({
        data: {
          songId: song.id,
          userId: userB.userId,
          invitedById: userA.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
      });

      const clientA = createManagedWs(song.id, userA.sessionId);
      await clientA.waitForOpen();
      await clientA.waitForMessage((m) => m.type === 'sync');

      const clientB = createManagedWs(song.id, userB.sessionId);
      await clientB.waitForOpen();
      await clientB.waitForMessage((m) => m.type === 'sync');
      clientB.clearMessages();
      clientA.clearMessages();

      // 1. A lance la lecture audio à 14.5 secondes à 92 BPM
      clientA.ws.send(
        JSON.stringify({
          type: 'studio:transport',
          action: 'play',
          position: 14.5,
          bpm: 92,
        }),
      );

      const transportMsg = await clientB.waitForMessage((m) => m.type === 'studio:transport');
      expect(transportMsg.actorId).toBe(userA.userId);
      expect(transportMsg.action).toBe('play');
      expect(transportMsg.position).toBe(14.5);
      expect(transportMsg.bpm).toBe(92);

      // 2. B active le métronome synchronisé à 92 BPM
      clientB.ws.send(
        JSON.stringify({
          type: 'studio:metronome',
          isEnabled: true,
          bpm: 92,
        }),
      );

      const metronomeMsg = await clientA.waitForMessage((m) => m.type === 'studio:metronome');
      expect(metronomeMsg.actorId).toBe(userB.userId);
      expect(metronomeMsg.isEnabled).toBe(true);
      expect(metronomeMsg.bpm).toBe(92);

      clientA.ws.close();
      clientB.ws.close();
    });
  });
});
