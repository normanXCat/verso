import { Prisma } from '@prisma/client';
import type { CreateSongInput, SongDetail, UpdateSongInput } from '@verso/shared';
import { prisma } from '../../config/prisma.js';
import { findSongById } from './songs.repository.js';

export type SongServiceErrorCode = 'album_not_found';

export class SongServiceError extends Error {
  constructor(public readonly code: SongServiceErrorCode) {
    super(code);
    this.name = 'SongServiceError';
  }
}

async function albumBelongsToUser(userId: string, albumId: string): Promise<boolean> {
  const album = await prisma.album.findFirst({
    where: { id: albumId, userId },
    select: { id: true },
  });
  return album !== null;
}

function normalizeTagNames(tags: string[]): string[] {
  const seen = new Set<string>();
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (trimmed.length > 0) {
      seen.add(trimmed);
    }
  }
  return Array.from(seen);
}

/**
 * Remplace l'ensemble des tags d'un texte. Chaque tag est rattaché à l'utilisateur
 * et créé à la volée si nécessaire.
 */
async function replaceSongTags(userId: string, songId: string, tags: string[]): Promise<void> {
  const normalized = normalizeTagNames(tags);

  await prisma.songTag.deleteMany({ where: { songId } });

  for (const name of normalized) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name },
      update: {},
    });
    await prisma.songTag.create({ data: { songId, tagId: tag.id } });
  }
}

async function assertAlbum(userId: string, albumId: string | null | undefined): Promise<void> {
  if (albumId && !(await albumBelongsToUser(userId, albumId))) {
    throw new SongServiceError('album_not_found');
  }
}

export async function createSong(userId: string, input: CreateSongInput): Promise<SongDetail> {
  await assertAlbum(userId, input.albumId);

  const song = await prisma.song.create({
    data: {
      userId,
      title: input.title,
      content: input.content,
      albumId: input.albumId ?? null,
    },
  });

  if (input.tags && input.tags.length > 0) {
    await replaceSongTags(userId, song.id, input.tags);
  }

  const created = await findSongById(userId, song.id);
  if (!created) {
    throw new Error('Le texte créé est introuvable');
  }
  return created;
}

export function getSong(userId: string, songId: string): Promise<SongDetail | null> {
  return findSongById(userId, songId);
}

export async function updateSong(
  userId: string,
  songId: string,
  input: UpdateSongInput,
): Promise<SongDetail | null> {
  const existing = await prisma.song.findFirst({
    where: { id: songId, userId },
    select: { id: true },
  });
  if (!existing) {
    return null;
  }

  await assertAlbum(userId, input.albumId);

  const data: Prisma.SongUncheckedUpdateInput = {};
  if (input.title !== undefined) {
    data.title = input.title;
  }
  if (input.content !== undefined) {
    data.content = input.content;
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }
  if (input.isFavorite !== undefined) {
    data.isFavorite = input.isFavorite;
  }
  if (input.albumId !== undefined) {
    data.albumId = input.albumId;
  }

  if (Object.keys(data).length > 0) {
    await prisma.song.update({ where: { id: songId }, data });
  }

  if (input.tags !== undefined) {
    await replaceSongTags(userId, songId, input.tags);
  }

  return findSongById(userId, songId);
}

export async function deleteSong(userId: string, songId: string): Promise<boolean> {
  const result = await prisma.song.deleteMany({ where: { id: songId, userId } });
  return result.count > 0;
}
