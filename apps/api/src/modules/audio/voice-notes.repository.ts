import type { VoiceNote } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

/** Liste les mémos vocaux d'un texte, du plus récent au plus ancien. */
export function listVoiceNotes(songId: string): Promise<VoiceNote[]> {
  return prisma.voiceNote.findMany({
    where: { songId },
    orderBy: { createdAt: 'desc' },
  });
}

/** Récupère un mémo vocal en imposant l'appartenance du texte à l'utilisateur. */
export function findVoiceNoteForUser(
  userId: string,
  voiceNoteId: string,
): Promise<VoiceNote | null> {
  return prisma.voiceNote.findFirst({
    where: { id: voiceNoteId, song: { userId } },
  });
}

/** Supprime l'enregistrement d'un mémo vocal. */
export function deleteVoiceNoteRecord(voiceNoteId: string): Promise<VoiceNote> {
  return prisma.voiceNote.delete({ where: { id: voiceNoteId } });
}
