import { randomUUID } from 'node:crypto';
import type { Instrumental } from '@prisma/client';
import {
  MAX_INSTRUMENTALS_PER_SONG,
  type ConfirmInstrumentalInput,
  type InstrumentalItem,
  type UpdateInstrumentalInput,
  type UploadUrlInput,
  type UploadUrlResult,
} from '@verso/shared';
import { prisma } from '../../config/prisma.js';
import { s3Storage, UPLOAD_URL_TTL_SECONDS } from '../../plugins/s3.plugin.js';
import {
  countInstrumentals,
  deactivateOtherInstrumentals,
  deleteInstrumentalRecord,
  findInstrumentalForUser,
  findSongOwner,
  listInstrumentals,
} from './audio.repository.js';

export type AudioServiceErrorCode = 'song_not_found' | 'instrumental_not_found' | 'quota_exceeded';

export class AudioServiceError extends Error {
  constructor(public readonly code: AudioServiceErrorCode) {
    super(code);
    this.name = 'AudioServiceError';
  }
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
};

/** Construit une clé S3 cloisonnée par utilisateur et par texte (jamais devinable). */
function buildS3Key(userId: string, songId: string, mimeType: string): string {
  const extension = EXTENSION_BY_MIME[mimeType] ?? 'bin';
  return `users/${userId}/songs/${songId}/${randomUUID()}.${extension}`;
}

async function assertSongOwnership(userId: string, songId: string): Promise<void> {
  const song = await findSongOwner(songId);
  if (!song || song.userId !== userId) {
    throw new AudioServiceError('song_not_found');
  }
}

async function toInstrumentalItem(row: Instrumental): Promise<InstrumentalItem> {
  return {
    id: row.id,
    songId: row.songId,
    title: row.title,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    durationSeconds: row.durationSeconds,
    bpm: row.bpm,
    musicalKey: row.musicalKey,
    isActive: row.isActive,
    downloadUrl: await s3Storage.createDownloadUrl(row.s3Key),
    createdAt: row.createdAt,
  };
}

/**
 * Génère une URL présignée de téléversement après vérification du cloisonnement
 * et du quota de 3 instrumentales par texte (FR-034).
 */
export async function createUploadUrl(
  userId: string,
  songId: string,
  input: UploadUrlInput,
): Promise<UploadUrlResult> {
  await assertSongOwnership(userId, songId);

  if ((await countInstrumentals(songId)) >= MAX_INSTRUMENTALS_PER_SONG) {
    throw new AudioServiceError('quota_exceeded');
  }

  const s3Key = buildS3Key(userId, songId, input.mimeType);
  const uploadUrl = await s3Storage.createUploadUrl(s3Key, input.mimeType);
  return { uploadUrl, s3Key, expiresInSeconds: UPLOAD_URL_TTL_SECONDS };
}

/**
 * Enregistre en base une instrumentale après téléversement réussi.
 * La piste confirmée devient la piste active unique du texte.
 */
export async function confirmInstrumental(
  userId: string,
  songId: string,
  input: ConfirmInstrumentalInput,
): Promise<InstrumentalItem> {
  await assertSongOwnership(userId, songId);

  if ((await countInstrumentals(songId)) >= MAX_INSTRUMENTALS_PER_SONG) {
    throw new AudioServiceError('quota_exceeded');
  }

  const created = await prisma.instrumental.create({
    data: {
      songId,
      title: input.title,
      s3Key: input.s3Key,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      durationSeconds: input.durationSeconds ?? null,
      bpm: input.bpm ?? null,
      musicalKey: input.musicalKey ?? null,
      isActive: true,
    },
  });

  await deactivateOtherInstrumentals(songId, created.id);

  return toInstrumentalItem(created);
}

/** Liste les instrumentales d'un texte avec une URL de lecture signée à la volée. */
export async function listSongInstrumentals(
  userId: string,
  songId: string,
): Promise<InstrumentalItem[]> {
  await assertSongOwnership(userId, songId);
  const rows = await listInstrumentals(songId);
  return Promise.all(rows.map(toInstrumentalItem));
}

/** Met à jour les métadonnées d'une instrumentale, ou bascule la piste active. */
export async function updateInstrumental(
  userId: string,
  instrumentalId: string,
  input: UpdateInstrumentalInput,
): Promise<InstrumentalItem | null> {
  const existing = await findInstrumentalForUser(userId, instrumentalId);
  if (!existing) {
    return null;
  }

  const data: {
    title?: string;
    bpm?: number | null;
    musicalKey?: string | null;
    isActive?: boolean;
  } = {};
  if (input.title !== undefined) {
    data.title = input.title;
  }
  if (input.bpm !== undefined) {
    data.bpm = input.bpm;
  }
  if (input.musicalKey !== undefined) {
    data.musicalKey = input.musicalKey;
  }
  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }

  const updated = await prisma.instrumental.update({
    where: { id: instrumentalId },
    data,
  });

  // Une seule piste active par texte : activer celle-ci désactive les autres.
  if (input.isActive === true) {
    await deactivateOtherInstrumentals(existing.songId, instrumentalId);
  }

  return toInstrumentalItem(updated);
}

/** Supprime une instrumentale en base puis l'objet binaire sur le stockage S3. */
export async function deleteInstrumental(userId: string, instrumentalId: string): Promise<boolean> {
  const existing = await findInstrumentalForUser(userId, instrumentalId);
  if (!existing) {
    return false;
  }

  await deleteInstrumentalRecord(instrumentalId);
  await s3Storage.deleteObject(existing.s3Key);
  return true;
}
