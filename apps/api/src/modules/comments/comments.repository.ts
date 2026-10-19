import { prisma } from '../../config/prisma.js';

export interface CreateCommentData {
  songId: string;
  authorId: string;
  content: string;
  startLine: number;
  endLine: number;
  parentId?: string | null;
}

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  avatarUrl: true,
};

export const commentsRepository = {
  /**
   * Créer un commentaire ou une réponse
   */
  async createComment(data: CreateCommentData) {
    return prisma.comment.create({
      data: {
        songId: data.songId,
        authorId: data.authorId,
        content: data.content,
        startLine: data.startLine,
        endLine: data.endLine,
        parentId: data.parentId ?? null,
      },
      include: {
        author: {
          select: AUTHOR_SELECT,
        },
      },
    });
  },

  /**
   * Trouver un commentaire par identifiant
   */
  async findCommentById(id: string) {
    return prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: AUTHOR_SELECT,
        },
        song: {
          select: {
            id: true,
            userId: true,
            albumId: true,
          },
        },
      },
    });
  },

  /**
   * Lister les commentaires d'un morceau avec leurs réponses imbriquées
   */
  async listCommentsBySong(songId: string, isResolved?: boolean) {
    const where: { songId: string; parentId: null; isResolved?: boolean } = {
      songId,
      parentId: null,
    };

    if (isResolved !== undefined) {
      where.isResolved = isResolved;
    }

    return prisma.comment.findMany({
      where,
      orderBy: [{ startLine: 'asc' }, { createdAt: 'asc' }],
      include: {
        author: {
          select: AUTHOR_SELECT,
        },
        resolvedBy: {
          select: AUTHOR_SELECT,
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: AUTHOR_SELECT,
            },
          },
        },
      },
    });
  },

  /**
   * Mettre à jour l'état de résolution
   */
  async updateResolution(
    id: string,
    isResolved: boolean,
    resolvedById: string | null,
    resolvedAt: Date | null,
  ) {
    return prisma.comment.update({
      where: { id },
      data: {
        isResolved,
        resolvedById,
        resolvedAt,
      },
      include: {
        author: {
          select: AUTHOR_SELECT,
        },
        resolvedBy: {
          select: AUTHOR_SELECT,
        },
      },
    });
  },

  /**
   * Supprimer un commentaire
   */
  async deleteComment(id: string) {
    return prisma.comment.delete({
      where: { id },
    });
  },
};
