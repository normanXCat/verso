import type { AlbumDetail, AlbumListItem, CreateAlbumInput, UpdateAlbumInput } from '@verso/shared';
import { prisma } from '../../config/prisma.js';
import { findAlbumById, listAlbumTrackIds, listAlbums } from './albums.repository.js';

export type AlbumServiceErrorCode = 'album_not_found' | 'song_not_found' | 'invalid_tracklist';

export class AlbumServiceError extends Error {
  constructor(public readonly code: AlbumServiceErrorCode) {
    super(code);
    this.name = 'AlbumServiceError';
  }
}

async function albumBelongsToUser(userId: string, albumId: string): Promise<boolean> {
  const album = await prisma.album.findFirst({
    where: { id: albumId, userId },
    select: { id: true },
  });
  return album !== null;
}

function assertAlbumOwnership(userId: string, albumId: string): Promise<void> {
  return albumBelongsToUser(userId, albumId).then((owns) => {
    if (!owns) {
      throw new AlbumServiceError('album_not_found');
    }
  });
}

/** Réattribue des positions contiguës (1..n) aux pistes d'un album, dans l'ordre fourni. */
async function resequenceTracks(albumId: string, songIds: string[]): Promise<void> {
  await prisma.$transaction(
    songIds.map((songId, index) =>
      prisma.song.updateMany({
        where: { id: songId, albumId },
        data: { positionInAlbum: index + 1 },
      }),
    ),
  );
}

export function listUserAlbums(userId: string): Promise<AlbumListItem[]> {
  return listAlbums(userId);
}

export function getAlbum(userId: string, albumId: string): Promise<AlbumDetail | null> {
  return findAlbumById(userId, albumId);
}

export async function createAlbum(userId: string, input: CreateAlbumInput): Promise<AlbumDetail> {
  const album = await prisma.album.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      coverImageKey: input.coverImageKey ?? null,
    },
  });

  const created = await findAlbumById(userId, album.id);
  if (!created) {
    throw new Error("L'album créé est introuvable");
  }
  return created;
}

export async function updateAlbum(
  userId: string,
  albumId: string,
  input: UpdateAlbumInput,
): Promise<AlbumDetail | null> {
  const existing = await prisma.album.findFirst({
    where: { id: albumId, userId },
    select: { id: true },
  });
  if (!existing) {
    return null;
  }

  const data: { title?: string; description?: string | null; coverImageKey?: string | null } = {};
  if (input.title !== undefined) {
    data.title = input.title;
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }
  if (input.coverImageKey !== undefined) {
    data.coverImageKey = input.coverImageKey;
  }

  if (Object.keys(data).length > 0) {
    await prisma.album.update({ where: { id: albumId }, data });
  }

  return findAlbumById(userId, albumId);
}

/**
 * Supprime l'album en détachant d'abord tous ses textes (FR-027).
 * Aucun texte n'est jamais supprimé : ils redeviennent simplement « sans album ».
 */
export async function deleteAlbum(userId: string, albumId: string): Promise<boolean> {
  const album = await prisma.album.findFirst({
    where: { id: albumId, userId },
    select: { id: true },
  });
  if (!album) {
    return false;
  }

  await prisma.$transaction([
    prisma.song.updateMany({
      where: { albumId, userId },
      data: { albumId: null, positionInAlbum: null },
    }),
    prisma.album.delete({ where: { id: albumId } }),
  ]);

  return true;
}

/** Rattache un texte existant à l'album et lui attribue la dernière position. */
export async function addTrack(
  userId: string,
  albumId: string,
  songId: string,
): Promise<AlbumDetail> {
  await assertAlbumOwnership(userId, albumId);

  const song = await prisma.song.findFirst({
    where: { id: songId, userId },
    select: { id: true },
  });
  if (!song) {
    throw new AlbumServiceError('song_not_found');
  }

  const aggregate = await prisma.song.aggregate({
    where: { albumId },
    _max: { positionInAlbum: true },
  });
  const nextPosition = (aggregate._max.positionInAlbum ?? 0) + 1;

  await prisma.song.update({
    where: { id: songId },
    data: { albumId, positionInAlbum: nextPosition },
  });

  const album = await findAlbumById(userId, albumId);
  if (!album) {
    throw new AlbumServiceError('album_not_found');
  }
  return album;
}

/** Retire un texte de l'album sans le supprimer, puis réajuste les positions restantes. */
export async function removeTrack(
  userId: string,
  albumId: string,
  songId: string,
): Promise<AlbumDetail> {
  await assertAlbumOwnership(userId, albumId);

  const song = await prisma.song.findFirst({
    where: { id: songId, userId, albumId },
    select: { id: true },
  });
  if (!song) {
    throw new AlbumServiceError('song_not_found');
  }

  await prisma.song.update({
    where: { id: songId },
    data: { albumId: null, positionInAlbum: null },
  });

  await resequenceTracks(albumId, await listAlbumTrackIds(albumId));

  const album = await findAlbumById(userId, albumId);
  if (!album) {
    throw new AlbumServiceError('album_not_found');
  }
  return album;
}

/**
 * Réordonne la tracklist. La liste fournie doit correspondre exactement à
 * l'ensemble des textes actuellement rattachés à l'album.
 */
export async function reorderTracks(
  userId: string,
  albumId: string,
  songIds: string[],
): Promise<AlbumDetail> {
  await assertAlbumOwnership(userId, albumId);

  const currentIds = await listAlbumTrackIds(albumId);
  const current = new Set(currentIds);
  const provided = new Set(songIds);

  const isSameSet =
    currentIds.length === songIds.length &&
    provided.size === songIds.length &&
    songIds.every((id) => current.has(id));

  if (!isSameSet) {
    throw new AlbumServiceError('invalid_tracklist');
  }

  await resequenceTracks(albumId, songIds);

  const album = await findAlbumById(userId, albumId);
  if (!album) {
    throw new AlbumServiceError('album_not_found');
  }
  return album;
}
