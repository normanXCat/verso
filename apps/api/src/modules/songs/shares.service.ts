import crypto from 'node:crypto';
import type {
  CreateShareLinkInput,
  CreatedShareLink,
  PublicSharedSong,
  ShareLinkItem,
} from '@verso/shared';
import { SHARE_TOKEN_PREFIX } from '@verso/shared';
import { prisma } from '../../config/prisma.js';

export type ShareServiceErrorCode = 'song_not_found' | 'link_not_found';

export class ShareServiceError extends Error {
  constructor(public readonly code: ShareServiceErrorCode) {
    super(code);
    this.name = 'ShareServiceError';
  }
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Le jeton brut n'est jamais stocké : seule son empreinte SHA-256 est conservée. */
function hashShareToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateShareToken(): { rawToken: string; tokenHash: string } {
  const rawToken = `${SHARE_TOKEN_PREFIX}${crypto.randomBytes(32).toString('base64url')}`;
  return { rawToken, tokenHash: hashShareToken(rawToken) };
}

function buildShareUrl(rawToken: string): string {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
  return `${base}/share/${rawToken}`;
}

function toShareLinkItem(link: {
  id: string;
  expiresAt: Date | null;
  isRevoked: boolean;
  accessCount: number;
  lastAccessedAt: Date | null;
  createdAt: Date;
}): ShareLinkItem {
  return {
    id: link.id,
    expiresAt: link.expiresAt,
    isRevoked: link.isRevoked,
    accessCount: link.accessCount,
    lastAccessedAt: link.lastAccessedAt,
    createdAt: link.createdAt,
  };
}

/**
 * Crée un lien de partage privé en lecture seule pour un texte de l'utilisateur,
 * avec expiration optionnelle (FR-041, FR-042). L'URL complète n'est renvoyée
 * qu'à cette occasion.
 */
export async function createShareLink(
  userId: string,
  songId: string,
  input: CreateShareLinkInput,
): Promise<CreatedShareLink> {
  const song = await prisma.song.findFirst({
    where: { id: songId, userId },
    select: { id: true },
  });
  if (!song) {
    throw new ShareServiceError('song_not_found');
  }

  const { rawToken, tokenHash } = generateShareToken();
  const expiresAt =
    input.expiresInDays != null ? new Date(Date.now() + input.expiresInDays * ONE_DAY_MS) : null;

  const link = await prisma.shareLink.create({
    data: { songId, tokenHash, expiresAt },
  });

  return { ...toShareLinkItem(link), shareUrl: buildShareUrl(rawToken) };
}

/**
 * Liste les liens de partage d'un texte, du plus récent au plus ancien.
 * Renvoie `null` si le texte n'appartient pas à l'utilisateur.
 */
export async function listShareLinks(
  userId: string,
  songId: string,
): Promise<ShareLinkItem[] | null> {
  const song = await prisma.song.findFirst({
    where: { id: songId, userId },
    select: { id: true },
  });
  if (!song) {
    return null;
  }

  const links = await prisma.shareLink.findMany({
    where: { songId },
    orderBy: { createdAt: 'desc' },
  });
  return links.map(toShareLinkItem);
}

/**
 * Révoque immédiatement un lien de partage (FR-043). Renvoie `false` si le lien
 * est introuvable ou n'appartient pas au texte de l'utilisateur.
 */
export async function revokeShareLink(
  userId: string,
  songId: string,
  linkId: string,
): Promise<boolean> {
  const link = await prisma.shareLink.findFirst({
    where: { id: linkId, songId, song: { userId } },
    select: { id: true },
  });
  if (!link) {
    return false;
  }

  await prisma.shareLink.update({ where: { id: linkId }, data: { isRevoked: true } });
  return true;
}

/**
 * Consultation anonyme et en lecture seule d'un texte via son jeton de partage.
 * Renvoie `null` si le lien est introuvable, expiré ou révoqué : la réponse ne
 * révèle rien sur l'existence du texte (FR-044, edge case lien expiré/révoqué).
 */
export async function getPublicSharedSong(rawToken: string): Promise<PublicSharedSong | null> {
  const tokenHash = hashShareToken(rawToken);
  const link = await prisma.shareLink.findUnique({
    where: { tokenHash },
    include: {
      song: {
        select: {
          title: true,
          content: true,
          status: true,
          updatedAt: true,
          user: { select: { displayName: true } },
        },
      },
    },
  });

  if (!link || link.isRevoked) {
    return null;
  }
  if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  await prisma.shareLink.update({
    where: { id: link.id },
    data: { accessCount: { increment: 1 }, lastAccessedAt: new Date() },
  });

  return {
    title: link.song.title,
    authorDisplayName: link.song.user.displayName?.trim() || 'Artiste Verso',
    content: link.song.content,
    status: link.song.status,
    updatedAt: link.song.updatedAt,
  };
}
