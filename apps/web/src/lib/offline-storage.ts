import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SongDetail, SongListItem } from '@verso/shared';

/** Version du schéma IndexedDB local. */
const DB_NAME = 'verso-offline';
const DB_VERSION = 1;

/** Nom du cache Workbox des réponses d'API (purgé à la déconnexion). */
export const API_CACHE_NAME = 'verso-api';

/** Brouillon local d'un texte, conservé même hors ligne (zéro perte). */
export interface OfflineDraft {
  songId: string;
  title: string;
  content: string;
  /** Contenu serveur connu au début de l'édition hors ligne (détection de conflit). */
  baseContent: string;
  updatedAt: string;
}

/** Enregistrement d'un texte mis en cache pour la consultation hors ligne. */
export interface OfflineSongRecord {
  id: string;
  title: string;
  content: string;
  status: SongListItem['status'];
  isFavorite: boolean;
  albumId: string | null;
  albumTitle: string | null;
  tags: string[];
  excerpt: string;
  updatedAt: string;
  createdAt: string;
  cachedAt: string;
}

/** Action de synchronisation en attente (file d'attente hors ligne). */
export interface SyncQueueItem {
  id?: number;
  songId: string;
  title: string;
  content: string;
  /** Contenu serveur connu au début de l'édition hors ligne (détection de conflit). */
  baseContent: string;
  createdAt: string;
}

interface VersoOfflineDB extends DBSchema {
  drafts: { key: string; value: OfflineDraft };
  songs: { key: string; value: OfflineSongRecord };
  'sync-queue': { key: number; value: SyncQueueItem; indexes: { 'by-song': string } };
}

let dbPromise: Promise<IDBPDatabase<VersoOfflineDB>> | null = null;

/**
 * Ouvre (et met en cache) la base IndexedDB locale.
 * Renvoie `null` si IndexedDB est indisponible (mode privé, environnement de test).
 */
function getDb(): Promise<IDBPDatabase<VersoOfflineDB>> | null {
  if (typeof indexedDB === 'undefined') {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB<VersoOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'songId' });
        }
        if (!db.objectStoreNames.contains('songs')) {
          db.createObjectStore('songs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync-queue')) {
          const queue = db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
          queue.createIndex('by-song', 'songId');
        }
      },
    });
  }
  return dbPromise;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toSongRecord(song: SongDetail | SongListItem): OfflineSongRecord {
  const content = 'content' in song ? song.content : '';
  return {
    id: song.id,
    title: song.title,
    content,
    status: song.status,
    isFavorite: song.isFavorite,
    albumId: song.albumId,
    albumTitle: song.albumTitle,
    tags: song.tags,
    excerpt: song.excerpt,
    updatedAt: toIso(song.updatedAt),
    createdAt: toIso(song.createdAt),
    cachedAt: new Date().toISOString(),
  };
}

function toSongDetail(record: OfflineSongRecord): SongDetail {
  return {
    id: record.id,
    title: record.title,
    status: record.status,
    isFavorite: record.isFavorite,
    albumId: record.albumId,
    albumTitle: record.albumTitle,
    tags: record.tags,
    excerpt: record.excerpt,
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
    content: record.content,
  };
}

// ---------------------------------------------------------------------------
// Brouillons locaux
// ---------------------------------------------------------------------------

export async function saveDraft(draft: OfflineDraft): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }
  try {
    await (await db).put('drafts', draft);
  } catch {
    // Stockage indisponible : la sauvegarde distante reste la source de vérité.
  }
}

export async function getDraft(songId: string): Promise<OfflineDraft | null> {
  const db = getDb();
  if (!db) {
    return null;
  }
  try {
    return (await (await db).get('drafts', songId)) ?? null;
  } catch {
    return null;
  }
}

export async function deleteDraft(songId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }
  try {
    await (await db).delete('drafts', songId);
  } catch {
    // Aucun nettoyage nécessaire.
  }
}

export async function listDrafts(): Promise<OfflineDraft[]> {
  const db = getDb();
  if (!db) {
    return [];
  }
  try {
    return await (await db).getAll('drafts');
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Cache des textes (consultation hors ligne)
// ---------------------------------------------------------------------------

export async function cacheSong(song: SongDetail | SongListItem): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }
  try {
    await (await db).put('songs', toSongRecord(song));
  } catch {
    // Cache best effort.
  }
}

export async function cacheSongs(songs: (SongDetail | SongListItem)[]): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }
  try {
    const database = await db;
    const tx = database.transaction('songs', 'readwrite');
    await Promise.all(songs.map((song) => tx.store.put(toSongRecord(song))));
    await tx.done;
  } catch {
    // Cache best effort.
  }
}

export async function getCachedSong(songId: string): Promise<SongDetail | null> {
  const db = getDb();
  if (!db) {
    return null;
  }
  try {
    const record = await (await db).get('songs', songId);
    return record ? toSongDetail(record) : null;
  } catch {
    return null;
  }
}

export async function listCachedSongs(): Promise<SongDetail[]> {
  const db = getDb();
  if (!db) {
    return [];
  }
  try {
    const records = await (await db).getAll('songs');
    return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toSongDetail);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// File d'attente de synchronisation
// ---------------------------------------------------------------------------

export async function enqueueSyncItem(item: SyncQueueItem): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }
  try {
    await (await db).add('sync-queue', item);
  } catch {
    // La file est recréée à la prochaine opportunité.
  }
}

/**
 * Ne conserve qu'une seule action en attente par texte : la plus récente écrase
 * la précédente (le contenu le plus frais gagne).
 */
export async function replaceSyncItem(item: SyncQueueItem): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }
  try {
    const database = await db;
    const tx = database.transaction('sync-queue', 'readwrite');
    const keys = await tx.store.index('by-song').getAllKeys(item.songId);
    await Promise.all(keys.map((key) => tx.store.delete(key)));
    await tx.store.add(item);
    await tx.done;
  } catch {
    // File best effort.
  }
}

/** Retire toutes les actions en attente d'un texte. */
export async function clearSyncItemForSong(songId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }
  try {
    const database = await db;
    const tx = database.transaction('sync-queue', 'readwrite');
    const keys = await tx.store.index('by-song').getAllKeys(songId);
    await Promise.all(keys.map((key) => tx.store.delete(key)));
    await tx.done;
  } catch {
    // File best effort.
  }
}

export async function listSyncQueue(): Promise<SyncQueueItem[]> {
  const db = getDb();
  if (!db) {
    return [];
  }
  try {
    return await (await db).getAll('sync-queue');
  } catch {
    return [];
  }
}

export async function removeSyncItem(id: number): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }
  try {
    await (await db).delete('sync-queue', id);
  } catch {
    // Rien à retirer.
  }
}

export async function clearSyncQueue(): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }
  try {
    await (await db).clear('sync-queue');
  } catch {
    // Rien à nettoyer.
  }
}

// ---------------------------------------------------------------------------
// Résolution de conflit
// ---------------------------------------------------------------------------

export type SyncDecision = 'up-to-date' | 'apply-local' | 'conflict';

/**
 * Décide de l'action de synchronisation d'un brouillon hors ligne face à l'état serveur.
 * - `up-to-date` : le serveur a déjà le contenu local, rien à faire.
 * - `apply-local` : le serveur est resté sur la base connue, on applique le contenu local.
 * - `conflict` : le serveur a divergé (autre appareil) ou le texte a disparu ; on
 *   préserve le contenu local sous forme d'une copie `[Titre] (copie hors ligne)`.
 */
export function decideSyncAction(params: {
  serverContent: string | null;
  localContent: string;
  baseContent: string;
}): SyncDecision {
  const { serverContent, localContent, baseContent } = params;
  if (serverContent === null) {
    return 'conflict';
  }
  if (serverContent === localContent) {
    return 'up-to-date';
  }
  if (serverContent === baseContent) {
    return 'apply-local';
  }
  return 'conflict';
}

// ---------------------------------------------------------------------------
// Nettoyage (déconnexion)
// ---------------------------------------------------------------------------

/**
 * Purge toutes les données locales : brouillons, cache des textes, file
 * d'attente et cache Workbox des réponses d'API (cloisonnement des sessions).
 */
export async function clearAllOfflineData(): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      const database = await db;
      const tx = database.transaction(['drafts', 'songs', 'sync-queue'], 'readwrite');
      await Promise.all([
        tx.objectStore('drafts').clear(),
        tx.objectStore('songs').clear(),
        tx.objectStore('sync-queue').clear(),
      ]);
      await tx.done;
    } catch {
      // Purge best effort.
    }
  }

  if (typeof caches !== 'undefined') {
    try {
      await caches.delete(API_CACHE_NAME);
    } catch {
      // Cache indisponible.
    }
  }
}
