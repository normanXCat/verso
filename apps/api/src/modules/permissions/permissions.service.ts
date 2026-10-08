import { prisma } from '../../config/prisma.js';
import type {
  AlbumAction,
  AlbumContext,
  CommentAction,
  CommentContext,
  InvitationAction,
  InvitationContext,
  PermissionAction,
  ResourceTarget,
  SongAction,
  SongContext,
  UserAction,
} from './permissions.types.js';

export class NotFoundAccessError extends Error {
  statusCode = 404;
  constructor(message = 'Ressource introuvable') {
    super(message);
    this.name = 'NotFoundAccessError';
  }
}

/**
 * Évaluation synchrone et pure des permissions sur un texte
 */
export function evaluateSongAction(userId: string, song: SongContext, action: SongAction): boolean {
  const isOwner = song.userId === userId;
  const isAlbumOwner = song.album ? song.album.userId === userId : false;

  const directCollab = song.collaborators?.find(
    (c) => c.userId === userId && c.status === 'ACTIVE',
  );
  const directRole = directCollab?.role;

  const albumCollab = song.album?.collaborators?.find(
    (c) => c.userId === userId && c.status === 'ACTIVE',
  );
  const albumRole = albumCollab?.role;

  const effectiveRole = directRole || albumRole;

  switch (action) {
    case 'read':
      return isOwner || isAlbumOwner || effectiveRole !== undefined;

    case 'edit_lyrics':
    case 'manage_audio':
    case 'resolve_comment':
    case 'edit_credits':
      return isOwner || isAlbumOwner || effectiveRole === 'CO_AUTHOR';

    case 'comment':
      return (
        isOwner || isAlbumOwner || effectiveRole === 'CO_AUTHOR' || effectiveRole === 'COMMENTER'
      );

    case 'manage_collaborators':
    case 'delete':
      return isOwner;

    case 'leave':
      return !isOwner && directCollab !== undefined;

    default:
      return false;
  }
}

/**
 * Évaluation synchrone et pure des permissions sur un album
 */
export function evaluateAlbumAction(
  userId: string,
  album: AlbumContext,
  action: AlbumAction,
): boolean {
  const isOwner = album.userId === userId;
  const collab = album.collaborators?.find((c) => c.userId === userId && c.status === 'ACTIVE');
  const role = collab?.role;

  switch (action) {
    case 'read':
      return isOwner || role !== undefined;

    case 'edit':
    case 'manage_tracks':
      return isOwner || role === 'CO_AUTHOR';

    case 'manage_collaborators':
    case 'delete':
      return isOwner;

    case 'leave':
      return !isOwner && collab !== undefined;

    default:
      return false;
  }
}

/**
 * Évaluation synchrone et pure des permissions sur un commentaire
 */
export function evaluateCommentAction(
  userId: string,
  comment: CommentContext,
  action: CommentAction,
): boolean {
  switch (action) {
    case 'reply':
      return evaluateSongAction(userId, comment.song, 'comment');

    case 'resolve':
    case 'reopen':
      return evaluateSongAction(userId, comment.song, 'resolve_comment');

    case 'delete':
      return comment.authorId === userId || comment.song.userId === userId;

    default:
      return false;
  }
}

/**
 * Évaluation synchrone et pure des permissions sur une invitation
 */
export function evaluateInvitationAction(
  userId: string,
  invitation: InvitationContext,
  action: InvitationAction,
): boolean {
  switch (action) {
    case 'revoke': {
      if (invitation.inviterId === userId) return true;
      if (invitation.song && invitation.song.userId === userId) return true;
      if (invitation.album && invitation.album.userId === userId) return true;
      return false;
    }

    case 'respond':
      return invitation.invitedUserId === userId;

    default:
      return false;
  }
}

/**
 * Évaluation synchrone et pure des permissions sur un utilisateur
 */
export function evaluateUserAction(
  userId: string,
  targetUserId: string,
  action: UserAction,
): boolean {
  switch (action) {
    case 'block':
    case 'unblock':
    case 'report':
      return userId !== targetUserId;

    default:
      return false;
  }
}

/**
 * Fonction centrale unique d'autorisation can(user, resource, action)
 * Résout le contexte depuis Prisma si seul l'ID est fourni.
 */
export async function can(
  user: { id: string },
  resource: ResourceTarget,
  action: PermissionAction,
): Promise<boolean> {
  if (!user || !user.id) return false;

  switch (resource.type) {
    case 'song': {
      const songData: SongContext | null =
        'data' in resource
          ? resource.data
          : await prisma.song.findUnique({
              where: { id: resource.id },
              select: {
                id: true,
                userId: true,
                albumId: true,
                collaborators: {
                  select: { userId: true, role: true, status: true },
                },
                album: {
                  select: {
                    id: true,
                    userId: true,
                    collaborators: {
                      select: { userId: true, role: true, status: true },
                    },
                  },
                },
              },
            });

      if (!songData) return false;
      return evaluateSongAction(user.id, songData, action as SongAction);
    }

    case 'album': {
      const albumData: AlbumContext | null =
        'data' in resource
          ? resource.data
          : await prisma.album.findUnique({
              where: { id: resource.id },
              select: {
                id: true,
                userId: true,
                collaborators: {
                  select: { userId: true, role: true, status: true },
                },
              },
            });

      if (!albumData) return false;
      return evaluateAlbumAction(user.id, albumData, action as AlbumAction);
    }

    case 'comment': {
      const commentData: CommentContext | null =
        'data' in resource
          ? resource.data
          : await prisma.comment.findUnique({
              where: { id: resource.id },
              select: {
                id: true,
                authorId: true,
                songId: true,
                song: {
                  select: {
                    id: true,
                    userId: true,
                    albumId: true,
                    collaborators: {
                      select: { userId: true, role: true, status: true },
                    },
                    album: {
                      select: {
                        id: true,
                        userId: true,
                        collaborators: {
                          select: { userId: true, role: true, status: true },
                        },
                      },
                    },
                  },
                },
              },
            });

      if (!commentData) return false;
      return evaluateCommentAction(user.id, commentData, action as CommentAction);
    }

    case 'invitation': {
      const invitationData: InvitationContext | null =
        'data' in resource
          ? resource.data
          : await prisma.invitation.findUnique({
              where: { id: resource.id },
              select: {
                id: true,
                inviterId: true,
                invitedUserId: true,
                invitedEmail: true,
                songId: true,
                albumId: true,
                song: {
                  select: {
                    id: true,
                    userId: true,
                  },
                },
                album: {
                  select: {
                    id: true,
                    userId: true,
                  },
                },
              },
            });

      if (!invitationData) return false;
      return evaluateInvitationAction(user.id, invitationData, action as InvitationAction);
    }

    case 'user': {
      const targetUserId = 'data' in resource ? resource.data.targetUserId : resource.id;
      return evaluateUserAction(user.id, targetUserId, action as UserAction);
    }

    default:
      return false;
  }
}

/**
 * Asserte que can() retourne true, sinon lève NotFoundAccessError (404)
 * garantissant l'anti-fuite d'existence constitutionnelle.
 */
export async function assertCan(
  user: { id: string },
  resource: ResourceTarget,
  action: PermissionAction,
): Promise<void> {
  const allowed = await can(user, resource, action);
  if (!allowed) {
    throw new NotFoundAccessError();
  }
}
