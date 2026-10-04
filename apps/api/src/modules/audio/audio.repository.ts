import type { Instrumental, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

/** Vérifie qu'un texte appartient bien à l'utilisateur, en ne lisant que l'identifiant. */
export function findSongOwner(songId: string): Promise<{ id: string; userId: string } | null> {
  return prisma.song.findUnique({
    where: { id: songId },
    select: { id: true, userId: true },
  });
}

/** Nombre d'instrumentales déjà rattachées à un texte (pour le quota). */
export function countInstrumentals(songId: string): Promise<number> {
  return prisma.instrumental.count({ where: { songId } });
}

/** Liste les instrumentales d'un texte, de la plus récente à la plus ancienne. */
export function listInstrumentals(songId: string): Promise<Instrumental[]> {
  return prisma.instrumental.findMany({
    where: { songId },
    orderBy: { createdAt: 'desc' },
  });
}

/** Récupère une instrumentale en imposant l'appartenance du texte à l'utilisateur. */
export function findInstrumentalForUser(
  userId: string,
  instrumentalId: string,
): Promise<Instrumental | null> {
  return prisma.instrumental.findFirst({
    where: { id: instrumentalId, song: { userId } },
  });
}

/** Désactive toutes les autres instrumentales d'un texte (une seule piste active). */
export function deactivateOtherInstrumentals(
  songId: string,
  keepId: string,
): Promise<Prisma.BatchPayload> {
  return prisma.instrumental.updateMany({
    where: { songId, id: { not: keepId } },
    data: { isActive: false },
  });
}

/** Supprime l'enregistrement d'une instrumentale. */
export function deleteInstrumentalRecord(instrumentalId: string): Promise<Instrumental> {
  return prisma.instrumental.delete({ where: { id: instrumentalId } });
}
