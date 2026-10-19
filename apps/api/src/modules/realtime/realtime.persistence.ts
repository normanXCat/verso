import * as Y from 'yjs';
import { prisma } from '../../config/prisma.js';

export interface ParticipantInfo {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  color: string;
}

export interface SongRoom {
  songId: string;
  doc: Y.Doc;
  subscribers: Map<unknown, ParticipantInfo>;
  saveTimeout: NodeJS.Timeout | null;
  lastSavedContent: string;
}

// In-memory active rooms per song
const rooms = new Map<string, SongRoom>();

export const realtimePersistence = {
  getRoom(songId: string): SongRoom | undefined {
    return rooms.get(songId);
  },

  getOrCreateRoom(songId: string, initialContent: string): SongRoom {
    let room = rooms.get(songId);
    if (!room) {
      const doc = new Y.Doc();
      const text = doc.getText('lyrics');
      if (initialContent) {
        text.insert(0, initialContent);
      }
      room = {
        songId,
        doc,
        subscribers: new Map(),
        saveTimeout: null,
        lastSavedContent: initialContent,
      };
      rooms.set(songId, room);
    }
    return room;
  },

  scheduleSave(songId: string, delayMs = 1500): void {
    const room = rooms.get(songId);
    if (!room) return;

    if (room.saveTimeout) {
      clearTimeout(room.saveTimeout);
    }

    room.saveTimeout = setTimeout(() => {
      void this.flushSave(songId);
    }, delayMs);
  },

  async flushSave(songId: string): Promise<void> {
    const room = rooms.get(songId);
    if (!room) return;

    if (room.saveTimeout) {
      clearTimeout(room.saveTimeout);
      room.saveTimeout = null;
    }

    const currentContent = room.doc.getText('lyrics').toString();
    if (currentContent !== room.lastSavedContent) {
      room.lastSavedContent = currentContent;
      try {
        await prisma.song.update({
          where: { id: songId },
          data: {
            content: currentContent,
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        // En cas d'erreur de base de données (ex: suppression en cours)
        console.error(`Erreur persistance temps réel pour song ${songId}:`, err);
      }
    }
  },

  async removeSubscriber(songId: string, socket: unknown): Promise<void> {
    const room = rooms.get(songId);
    if (!room) return;

    room.subscribers.delete(socket);

    if (room.subscribers.size === 0) {
      await this.flushSave(songId);
      rooms.delete(songId);
    }
  },

  clearForTesting(): void {
    for (const room of rooms.values()) {
      if (room.saveTimeout) {
        clearTimeout(room.saveTimeout);
      }
    }
    rooms.clear();
  },
};
