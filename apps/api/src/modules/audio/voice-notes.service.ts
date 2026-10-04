import { randomUUID } from 'node:crypto';
import type { VoiceNote } from '@prisma/client';
import type {
  ConfirmVoiceNoteInput,
  UploadUrlResult,
  VoiceNoteItem,
  VoiceNoteUploadUrlInput,
} from '@verso/shared';
import { prisma } from '../../config/prisma.js';
import { s3Storage, UPLOAD_URL_TTL_SECONDS } from '../../plugins/s3.plugin.js';
import { findSongOwner } from './audio.repository.js';
import {
  deleteVoiceNoteRecord,
  findVoiceNoteForUser,
  listVoiceNotes,
} from './voice-notes.repository.js';

export type VoiceNoteServiceErrorCode = 'song_not_found' | 'voice_note_not_found';

export class VoiceNoteServiceError extends Error {
  constructor(public readonly code: VoiceNoteServiceErrorCode) {
    super(code);
    this.name = 'VoiceNoteServiceError';
  }
}

const VOICE_EXTENSION_BY_MIME: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
};

/** Clé S3 cloisonnée par utilisateur et par texte, dédiée aux mémos vocaux. */
function buildVoiceS3Key(userId: string, songId: string, mimeType: string): string {
  const extension = VOICE_EXTENSION_BY_MIME[mimeType] ?? 'bin';
  return `users/${userId}/songs/${songId}/voice/${randomUUID()}.${extension}`;
}

async function assertSongOwnership(userId: string, songId: string): Promise<void> {
  const song = await findSongOwner(songId);
  if (!song || song.userId !== userId) {
    throw new VoiceNoteServiceError('song_not_found');
  }
}

async function toVoiceNoteItem(row: VoiceNote): Promise<VoiceNoteItem> {
  return {
    id: row.id,
    songId: row.songId,
    durationSeconds: row.durationSeconds,
    downloadUrl: await s3Storage.createDownloadUrl(row.s3Key),
    createdAt: row.createdAt,
  };
}

/** Génère une URL présignée de téléversement pour un mémo vocal (FR-048). */
export async function createVoiceUploadUrl(
  userId: string,
  songId: string,
  input: VoiceNoteUploadUrlInput,
): Promise<UploadUrlResult> {
  await assertSongOwnership(userId, songId);

  const s3Key = buildVoiceS3Key(userId, songId, input.mimeType);
  const uploadUrl = await s3Storage.createUploadUrl(s3Key, input.mimeType);
  return { uploadUrl, s3Key, expiresInSeconds: UPLOAD_URL_TTL_SECONDS };
}

/** Enregistre en base un mémo vocal après téléversement réussi. */
export async function confirmVoiceNote(
  userId: string,
  songId: string,
  input: ConfirmVoiceNoteInput,
): Promise<VoiceNoteItem> {
  await assertSongOwnership(userId, songId);

  const created = await prisma.voiceNote.create({
    data: {
      songId,
      s3Key: input.s3Key,
      durationSeconds: input.durationSeconds ?? null,
    },
  });

  return toVoiceNoteItem(created);
}

/** Liste les mémos vocaux d'un texte avec une URL de lecture signée à la volée. */
export async function listSongVoiceNotes(userId: string, songId: string): Promise<VoiceNoteItem[]> {
  await assertSongOwnership(userId, songId);
  const rows = await listVoiceNotes(songId);
  return Promise.all(rows.map(toVoiceNoteItem));
}

/** Supprime un mémo vocal en base puis l'objet binaire sur le stockage S3. */
export async function deleteVoiceNote(userId: string, voiceNoteId: string): Promise<boolean> {
  const existing = await findVoiceNoteForUser(userId, voiceNoteId);
  if (!existing) {
    return false;
  }

  await deleteVoiceNoteRecord(voiceNoteId);
  await s3Storage.deleteObject(existing.s3Key);
  return true;
}
