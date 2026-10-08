import type { CreateCommentInput, ReplyCommentInput } from '@verso/shared';

const API_BASE_URL = '/api';

export class CommentsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'CommentsApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new CommentsApiError(
      (data as { message?: string }).message || `Erreur (${response.status})`,
      response.status,
    );
  }

  return data as T;
}

export interface CommentAuthor {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CommentReplyItem {
  id: string;
  parentId: string | null;
  content: string;
  startLine: number;
  endLine: number;
  songId: string;
  authorId: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface CommentItem {
  id: string;
  content: string;
  startLine: number;
  endLine: number;
  songId: string;
  authorId: string;
  author: CommentAuthor;
  isResolved: boolean;
  resolvedById?: string | null;
  resolvedBy?: CommentAuthor | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  replies: CommentReplyItem[];
}

export const commentsClient = {
  /**
   * Lister les commentaires d'un morceau
   */
  async listComments(songId: string, isResolved?: boolean): Promise<CommentItem[]> {
    const params = new URLSearchParams();
    if (isResolved !== undefined) {
      params.set('isResolved', String(isResolved));
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await request<{ comments: CommentItem[] }>(`/songs/${songId}/comments${query}`);
    return res.comments;
  },

  /**
   * Créer un commentaire ancré
   */
  async createComment(songId: string, input: CreateCommentInput): Promise<CommentItem> {
    const res = await request<{ comment: CommentItem }>(`/songs/${songId}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.comment;
  },

  /**
   * Répondre à un commentaire existant
   */
  async replyToComment(commentId: string, input: ReplyCommentInput): Promise<CommentReplyItem> {
    const res = await request<{ reply: CommentReplyItem }>(`/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.reply;
  },

  /**
   * Marquer un fil comme résolu
   */
  async resolveComment(commentId: string): Promise<CommentItem> {
    const res = await request<{ comment: CommentItem }>(`/comments/${commentId}/resolve`, {
      method: 'PATCH',
    });
    return res.comment;
  },

  /**
   * Rouvrir un commentaire
   */
  async reopenComment(commentId: string): Promise<CommentItem> {
    const res = await request<{ comment: CommentItem }>(`/comments/${commentId}/reopen`, {
      method: 'PATCH',
    });
    return res.comment;
  },

  /**
   * Supprimer un commentaire
   */
  async deleteComment(commentId: string): Promise<void> {
    await request<void>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};
