import { prisma } from '../../config/prisma.js';
import { assertCan, NotFoundAccessError } from '../permissions/permissions.service.js';
import { commentsRepository } from './comments.repository.js';
import type { CreateCommentInput, ReplyCommentInput } from '@verso/shared';

/**
 * Assainit une chaîne de caractères contre les injections XSS
 */
export function sanitizeContent(text: string): string {
  // Supprime les balises HTML et les gestionnaires d'événements
  const stripped = text.replace(/<[^>]*>/g, '');
  return stripped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Extrait les mentions @nom du contenu
 */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_\u00C0-\u017F-]+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

interface UserProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

function formatAuthor(author: UserProfile, isAnonymized: boolean) {
  if (isAnonymized) {
    return {
      id: author.id,
      displayName: 'Ancien collaborateur',
      avatarUrl: null,
    };
  }
  return {
    id: author.id,
    displayName: author.displayName,
    avatarUrl: author.avatarUrl,
  };
}

export const commentsService = {
  /**
   * Créer un commentaire ancré sur des lignes d'un texte
   */
  async createComment(user: { id: string }, songId: string, input: CreateCommentInput) {
    await assertCan(user, { type: 'song', id: songId }, 'comment');

    const sanitized = sanitizeContent(input.content);

    const comment = await commentsRepository.createComment({
      songId,
      authorId: user.id,
      content: sanitized,
      startLine: input.startLine,
      endLine: input.endLine,
    });

    // Gestion des notifications et mentions
    await this.notifyParticipantsOnComment(user.id, songId, comment.id, input.content);

    return {
      ...comment,
      author: formatAuthor(comment.author, comment.isAnonymized),
      replies: [],
    };
  },

  /**
   * Ajouter une réponse à un commentaire existant
   */
  async replyToComment(user: { id: string }, commentId: string, input: ReplyCommentInput) {
    const parent = await commentsRepository.findCommentById(commentId);
    if (!parent) {
      throw new NotFoundAccessError('Commentaire introuvable');
    }

    await assertCan(user, { type: 'comment', id: commentId }, 'reply');

    const sanitized = sanitizeContent(input.content);

    const reply = await commentsRepository.createComment({
      songId: parent.songId,
      authorId: user.id,
      content: sanitized,
      startLine: parent.startLine,
      endLine: parent.endLine,
      parentId: parent.id,
    });

    // Notifier l'auteur du commentaire parent et les mentions
    await this.notifyParticipantsOnReply(
      user.id,
      parent.songId,
      parent.id,
      reply.id,
      parent.authorId,
      input.content,
    );

    return {
      ...reply,
      author: formatAuthor(reply.author, reply.isAnonymized),
    };
  },

  /**
   * Lister les commentaires d'un morceau
   */
  async listComments(user: { id: string }, songId: string, isResolved?: boolean) {
    await assertCan(user, { type: 'song', id: songId }, 'read');

    const comments = await commentsRepository.listCommentsBySong(songId, isResolved);

    return comments.map((c) => ({
      ...c,
      author: formatAuthor(c.author, c.isAnonymized),
      resolvedBy: c.resolvedBy
        ? {
            id: c.resolvedBy.id,
            displayName: c.resolvedBy.displayName,
            avatarUrl: c.resolvedBy.avatarUrl,
          }
        : null,
      replies: c.replies.map((r) => ({
        ...r,
        author: formatAuthor(r.author, r.isAnonymized),
      })),
    }));
  },

  /**
   * Résoudre un fil de commentaire
   */
  async resolveComment(user: { id: string }, commentId: string) {
    await assertCan(user, { type: 'comment', id: commentId }, 'resolve');

    const updated = await commentsRepository.updateResolution(commentId, true, user.id, new Date());

    return {
      ...updated,
      author: formatAuthor(updated.author, updated.isAnonymized),
      resolvedBy: updated.resolvedBy
        ? {
            id: updated.resolvedBy.id,
            displayName: updated.resolvedBy.displayName,
            avatarUrl: updated.resolvedBy.avatarUrl,
          }
        : null,
    };
  },

  /**
   * Rouvrir un commentaire résolu
   */
  async reopenComment(user: { id: string }, commentId: string) {
    await assertCan(user, { type: 'comment', id: commentId }, 'reopen');

    const updated = await commentsRepository.updateResolution(commentId, false, null, null);

    return {
      ...updated,
      author: formatAuthor(updated.author, updated.isAnonymized),
      resolvedBy: null,
    };
  },

  /**
   * Supprimer un commentaire
   */
  async deleteComment(user: { id: string }, commentId: string) {
    await assertCan(user, { type: 'comment', id: commentId }, 'delete');

    await commentsRepository.deleteComment(commentId);
  },

  /**
   * Gérer les notifications pour un nouveau commentaire
   */
  async notifyParticipantsOnComment(
    authorId: string,
    songId: string,
    commentId: string,
    rawContent: string,
  ) {
    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: {
        collaborators: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, displayName: true } } },
        },
        user: { select: { id: true, displayName: true } },
      },
    });

    if (!song) return;

    const notifiedUserIds = new Set<string>();

    // Traitement des mentions
    const mentionedNames = extractMentions(rawContent);
    const potentialUsers = [song.user, ...song.collaborators.map((c) => c.user)];

    for (const name of mentionedNames) {
      const match = potentialUsers.find(
        (u) =>
          u.id !== authorId &&
          u.displayName &&
          u.displayName.toLowerCase().replace(/\s+/g, '') === name.replace(/\s+/g, ''),
      );
      if (match && !notifiedUserIds.has(match.id)) {
        notifiedUserIds.add(match.id);
        await prisma.notification.create({
          data: {
            type: 'MENTION',
            recipientId: match.id,
            actorId: authorId,
            songId,
            commentId,
          },
        });
      }
    }

    // Notifier le propriétaire s'il n'est pas l'auteur et n'a pas déjà reçu une mention
    if (song.userId !== authorId && !notifiedUserIds.has(song.userId)) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT_ADDED',
          recipientId: song.userId,
          actorId: authorId,
          songId,
          commentId,
        },
      });
    }
  },

  /**
   * Gérer les notifications pour une réponse
   */
  async notifyParticipantsOnReply(
    authorId: string,
    songId: string,
    _parentCommentId: string,
    replyId: string,
    parentAuthorId: string,
    rawContent: string,
  ) {
    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: {
        collaborators: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, displayName: true } } },
        },
        user: { select: { id: true, displayName: true } },
      },
    });

    if (!song) return;

    const notifiedUserIds = new Set<string>();

    // Mentions
    const mentionedNames = extractMentions(rawContent);
    const potentialUsers = [song.user, ...song.collaborators.map((c) => c.user)];

    for (const name of mentionedNames) {
      const match = potentialUsers.find(
        (u) =>
          u.id !== authorId &&
          u.displayName &&
          u.displayName.toLowerCase().replace(/\s+/g, '') === name.replace(/\s+/g, ''),
      );
      if (match && !notifiedUserIds.has(match.id)) {
        notifiedUserIds.add(match.id);
        await prisma.notification.create({
          data: {
            type: 'MENTION',
            recipientId: match.id,
            actorId: authorId,
            songId,
            commentId: replyId,
          },
        });
      }
    }

    // Notifier l'auteur du commentaire parent
    if (parentAuthorId !== authorId && !notifiedUserIds.has(parentAuthorId)) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT_REPLY',
          recipientId: parentAuthorId,
          actorId: authorId,
          songId,
          commentId: replyId,
        },
      });
    }
  },
};
