import { Prisma } from '@prisma/client';
import {
  cleanExcerpt,
  SONG_EXCERPT_MAX_LENGTH,
  type SearchSongsQuery,
  type SongDetail,
  type SongListItem,
} from '@verso/shared';
import { prisma } from '../../config/prisma.js';

export const SONG_INCLUDE = {
  album: { select: { id: true, title: true } },
  tags: { include: { tag: { select: { name: true } } } },
} satisfies Prisma.SongInclude;

export type SongWithRelations = Prisma.SongGetPayload<{ include: typeof SONG_INCLUDE }>;

/**
 * Construit la clause `where` Prisma à partir de la requête validée.
 * Le `userId` est toujours imposé pour garantir le cloisonnement des données.
 */
function buildWhere(userId: string, query: SearchSongsQuery): Prisma.SongWhereInput {
  const where: Prisma.SongWhereInput = { userId };

  if (query.filter === 'drafts') {
    where.status = 'DRAFT';
  } else if (query.filter === 'completed') {
    where.status = 'COMPLETED';
  } else if (query.filter === 'favorites') {
    where.isFavorite = true;
  }

  if (query.albumId) {
    where.albumId = query.albumId;
  }

  if (query.tag) {
    where.tags = { some: { tag: { name: query.tag } } };
  }

  if (query.q.length > 0) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { content: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  return where;
}

function buildOrderBy(sort: SearchSongsQuery['sort']): Prisma.SongOrderByWithRelationInput {
  if (sort === 'oldest') {
    return { createdAt: 'asc' };
  }
  if (sort === 'title') {
    return { title: 'asc' };
  }
  return { updatedAt: 'desc' };
}

/**
 * Produit un extrait de paroles nettoyé (Markdown et sections retirés) et tronqué pour les listes.
 */
function buildExcerpt(content: string): string {
  return cleanExcerpt(content, SONG_EXCERPT_MAX_LENGTH);
}

export function toSongDetail(song: SongWithRelations): SongDetail {
  return { ...toSongListItem(song), content: song.content, revision: song.revision ?? 1 };
}

export function toSongListItem(song: SongWithRelations): SongListItem {
  return {
    id: song.id,
    userId: song.userId,
    title: song.title,
    status: song.status,
    isFavorite: song.isFavorite,
    albumId: song.album?.id ?? null,
    albumTitle: song.album?.title ?? null,
    tags: song.tags.map((songTag) => songTag.tag.name),
    excerpt: buildExcerpt(song.content),
    revision: song.revision,
    updatedAt: song.updatedAt,
    createdAt: song.createdAt,
  };
}

/**
 * Recherche plein texte (titre et paroles) et applique les filtres combinables
 * de l'espace personnel d'un utilisateur, avec pagination et tri.
 */
export async function searchSongs(
  userId: string,
  query: SearchSongsQuery,
): Promise<{ items: SongListItem[]; total: number }> {
  const where = buildWhere(userId, query);

  const [songs, total] = await prisma.$transaction([
    prisma.song.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
      take: query.limit,
      skip: query.offset,
      include: SONG_INCLUDE,
    }),
    prisma.song.count({ where }),
  ]);

  return { items: songs.map(toSongListItem), total };
}

/**
 * Récupère un texte par son identifiant avec l'ensemble de ses relations.
 */
export async function findSongById(
  songIdOrUserId: string,
  maybeSongId?: string,
): Promise<SongDetail | null> {
  const songId = maybeSongId ?? songIdOrUserId;
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: SONG_INCLUDE,
  });
  return song ? toSongDetail(song) : null;
}
