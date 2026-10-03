import type { SongDetail, SongVersionItem } from '@verso/shared';
import { prisma } from '../../config/prisma.js';
import { findSongById } from './songs.repository.js';

/** Fenêtre d'inactivité au-delà de laquelle un enregistrement archive un instantané. */
export const VERSION_IDLE_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Archive un instantané immuable de l'état courant d'un texte.
 * L'historique est conservé indéfiniment : aucune purge, aucun plafond (FR-029).
 */
async function archiveSongSnapshot(songId: string, title: string, content: string): Promise<void> {
  await prisma.songVersion.create({
    data: { songId, title, content },
  });
}

/**
 * Décide puis exécute l'archivage d'un instantané avant modification.
 * Un instantané est créé si `createVersion` est demandé ou si la dernière
 * version remonte à plus de 5 minutes (session d'écriture distincte).
 */
export async function maybeArchiveBeforeUpdate(
  songId: string,
  current: { title: string; content: string },
  createVersion: boolean | undefined,
): Promise<void> {
  if (createVersion) {
    await archiveSongSnapshot(songId, current.title, current.content);
    return;
  }

  const last = await prisma.songVersion.findFirst({
    where: { songId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  const isIdle = !last || Date.now() - last.createdAt.getTime() > VERSION_IDLE_INTERVAL_MS;
  if (isIdle) {
    await archiveSongSnapshot(songId, current.title, current.content);
  }
}

/** Liste l'historique d'un texte, de la version la plus récente à la plus ancienne. */
export async function listVersions(
  userId: string,
  songId: string,
): Promise<SongVersionItem[] | null> {
  const song = await prisma.song.findFirst({
    where: { id: songId, userId },
    select: { id: true },
  });
  if (!song) {
    return null;
  }

  const versions = await prisma.songVersion.findMany({
    where: { songId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, content: true, createdAt: true },
  });
  return versions;
}

/**
 * Restaure une version antérieure comme état courant du texte.
 * L'état précédent est archivé au préalable : l'historique n'est jamais écrasé.
 */
export async function restoreVersion(
  userId: string,
  songId: string,
  versionId: string,
): Promise<SongDetail | null> {
  const song = await prisma.song.findFirst({
    where: { id: songId, userId },
    select: { id: true, title: true, content: true },
  });
  if (!song) {
    return null;
  }

  const version = await prisma.songVersion.findFirst({
    where: { id: versionId, songId },
    select: { id: true, title: true, content: true },
  });
  if (!version) {
    return null;
  }

  await prisma.$transaction([
    prisma.songVersion.create({
      data: { songId, title: song.title, content: song.content },
    }),
    prisma.song.update({
      where: { id: songId },
      data: { title: version.title, content: version.content },
    }),
  ]);

  return findSongById(userId, songId);
}
