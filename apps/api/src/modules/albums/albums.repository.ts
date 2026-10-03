import { Prisma } from '@prisma/client';
import {
  SONG_EXCERPT_MAX_LENGTH,
  type AlbumDetail,
  type AlbumListItem,
  type AlbumTrack,
} from '@verso/shared';
import { prisma } from '../../config/prisma.js';

const ALBUM_LIST_INCLUDE = {
  _count: { select: { songs: true } },
} satisfies Prisma.AlbumInclude;

const ALBUM_DETAIL_INCLUDE = {
  songs: {
    orderBy: [{ positionInAlbum: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      title: true,
      positionInAlbum: true,
      status: true,
      content: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.AlbumInclude;

type AlbumListRow = Prisma.AlbumGetPayload<{ include: typeof ALBUM_LIST_INCLUDE }>;
type AlbumDetailRow = Prisma.AlbumGetPayload<{ include: typeof ALBUM_DETAIL_INCLUDE }>;

function buildExcerpt(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= SONG_EXCERPT_MAX_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, SONG_EXCERPT_MAX_LENGTH).trimEnd()}…`;
}

function toAlbumListItem(album: AlbumListRow): AlbumListItem {
  return {
    id: album.id,
    title: album.title,
    description: album.description,
    // La signature des URLs S3 arrive avec le module audio (Phase 8).
    coverImageUrl: null,
    tracksCount: album._count.songs,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
  };
}

function toAlbumTrack(song: AlbumDetailRow['songs'][number], fallbackPosition: number): AlbumTrack {
  return {
    id: song.id,
    title: song.title,
    position: song.positionInAlbum ?? fallbackPosition,
    status: song.status,
    excerpt: buildExcerpt(song.content),
    updatedAt: song.updatedAt,
  };
}

function toAlbumDetail(album: AlbumDetailRow): AlbumDetail {
  return {
    id: album.id,
    title: album.title,
    description: album.description,
    coverImageUrl: null,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
    tracks: album.songs.map((song, index) => toAlbumTrack(song, index + 1)),
  };
}

/** Liste les albums d'un utilisateur, du plus récent au plus ancien, avec le nombre de pistes. */
export async function listAlbums(userId: string): Promise<AlbumListItem[]> {
  const albums = await prisma.album.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: ALBUM_LIST_INCLUDE,
  });
  return albums.map(toAlbumListItem);
}

/** Récupère un album et sa tracklist ordonnée en imposant l'appartenance à l'utilisateur. */
export async function findAlbumById(userId: string, albumId: string): Promise<AlbumDetail | null> {
  const album = await prisma.album.findFirst({
    where: { id: albumId, userId },
    include: ALBUM_DETAIL_INCLUDE,
  });
  return album ? toAlbumDetail(album) : null;
}

/** Identifiants des textes actuellement rattachés à l'album, dans l'ordre de la tracklist. */
export async function listAlbumTrackIds(albumId: string): Promise<string[]> {
  const songs = await prisma.song.findMany({
    where: { albumId },
    orderBy: [{ positionInAlbum: 'asc' }, { createdAt: 'asc' }],
    select: { id: true },
  });
  return songs.map((song) => song.id);
}
