import type {
  CollaboratorItem,
  CollaboratorRole,
  CreateInvitationInput,
  InvitationItem,
  SharedWithMeQuery,
} from '@verso/shared';
import { buildRequestHeaders } from './http-client.js';

const API_BASE_URL = '/api';

export class CollaborationApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'CollaborationApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: buildRequestHeaders(options),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new CollaborationApiError(
      (data as { message?: string }).message || `Erreur (${response.status})`,
      response.status,
    );
  }

  return data as T;
}

export interface CollaboratorsResponse {
  collaborators: CollaboratorItem[];
  pendingInvitations: InvitationItem[];
}

export interface CreateInvitationResponse {
  id: string;
  token: string;
  role: CollaboratorRole;
  status: string;
  expiresAt: string;
  invitedUser?: { id: string; displayName: string | null; avatarUrl: string | null } | null;
  invitedEmail?: string | null;
}

export interface SharedWithMeItem {
  id: string;
  type: 'song' | 'album';
  title: string;
  role: CollaboratorRole;
  owner: { id: string; displayName: string | null; avatarUrl: string | null };
  updatedAt: string;
  trackCount?: number;
}

export const collaborationClient = {
  // Morceaux
  async getSongCollaborators(songId: string): Promise<CollaboratorsResponse> {
    return request<CollaboratorsResponse>(`/songs/${encodeURIComponent(songId)}/collaborators`);
  },

  async inviteToSong(
    songId: string,
    payload: CreateInvitationInput,
  ): Promise<CreateInvitationResponse> {
    return request<CreateInvitationResponse>(`/songs/${encodeURIComponent(songId)}/invitations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateSongCollaboratorRole(
    songId: string,
    userId: string,
    role: CollaboratorRole,
  ): Promise<CollaboratorItem> {
    return request<CollaboratorItem>(
      `/songs/${encodeURIComponent(songId)}/collaborators/${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      },
    );
  },

  async revokeSongCollaborator(songId: string, userId: string): Promise<CollaboratorItem> {
    return request<CollaboratorItem>(
      `/songs/${encodeURIComponent(songId)}/collaborators/${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
      },
    );
  },

  // Albums
  async getAlbumCollaborators(albumId: string): Promise<CollaboratorsResponse> {
    return request<CollaboratorsResponse>(`/albums/${encodeURIComponent(albumId)}/collaborators`);
  },

  async inviteToAlbum(
    albumId: string,
    payload: CreateInvitationInput,
  ): Promise<CreateInvitationResponse> {
    return request<CreateInvitationResponse>(`/albums/${encodeURIComponent(albumId)}/invitations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateAlbumCollaboratorRole(
    albumId: string,
    userId: string,
    role: CollaboratorRole,
  ): Promise<CollaboratorItem> {
    return request<CollaboratorItem>(
      `/albums/${encodeURIComponent(albumId)}/collaborators/${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      },
    );
  },

  async revokeAlbumCollaborator(albumId: string, userId: string): Promise<CollaboratorItem> {
    return request<CollaboratorItem>(
      `/albums/${encodeURIComponent(albumId)}/collaborators/${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
      },
    );
  },

  // Acceptation / refus
  async acceptInvitation(
    token: string,
  ): Promise<{ message: string; collaborator: CollaboratorItem }> {
    return request<{ message: string; collaborator: CollaboratorItem }>(
      `/invitations/${encodeURIComponent(token)}/accept`,
      {
        method: 'POST',
      },
    );
  },

  async declineInvitation(token: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/invitations/${encodeURIComponent(token)}/decline`, {
      method: 'POST',
    });
  },

  // Invitations reçues
  async getUserInvitations(): Promise<InvitationItem[]> {
    return request<InvitationItem[]>('/collaborations/invitations');
  },

  // Quitter une œuvre
  async leaveCollaboration(
    resourceType: 'song' | 'album',
    resourceId: string,
  ): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/collaborations/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}/leave`,
      {
        method: 'DELETE',
      },
    );
  },

  // Espace Partagés avec moi
  async getSharedWithMe(query?: SharedWithMeQuery): Promise<{ items: SharedWithMeItem[] }> {
    const params = new URLSearchParams();
    if (query?.role) params.set('role', query.role);
    if (query?.ownerId) params.set('ownerId', query.ownerId);
    if (query?.type) params.set('type', query.type);

    const qs = params.toString();
    return request<{ items: SharedWithMeItem[] }>(
      `/collaborations/shared-with-me${qs ? `?${qs}` : ''}`,
    );
  },
};
