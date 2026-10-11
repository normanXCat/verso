import type {
  CreateAbuseReportInput,
  PublicUserSummary,
  SongActivityItem,
  UpdateProfileInput,
} from '@verso/shared';

export interface AuthorProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface BlockedUserItem {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  blockedAt: string;
}

const API_BASE_URL = '/api';

export class ModerationApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'ModerationApiError';
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
    throw new ModerationApiError(
      (data as { message?: string }).message || `Erreur (${response.status})`,
      response.status,
    );
  }

  return data as T;
}

export const moderationClient = {
  async searchUsers(query: string): Promise<{ users: PublicUserSummary[] }> {
    const q = encodeURIComponent(query.trim());
    return request<{ users: PublicUserSummary[] }>(`/users/search?q=${q}`);
  },

  async getUserProfile(userId: string): Promise<AuthorProfile> {
    return request<AuthorProfile>(`/users/${encodeURIComponent(userId)}/profile`);
  },

  async updateProfile(data: UpdateProfileInput): Promise<AuthorProfile> {
    return request<AuthorProfile>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getBlockedUsers(): Promise<{ blockedUsers: BlockedUserItem[] }> {
    return request<{ blockedUsers: BlockedUserItem[] }>('/users/blocked');
  },

  async blockUser(userId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/users/${encodeURIComponent(userId)}/block`, {
      method: 'POST',
    });
  },

  async unblockUser(userId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/users/${encodeURIComponent(userId)}/block`, {
      method: 'DELETE',
    });
  },

  async createReport(data: CreateAbuseReportInput): Promise<{ message: string; id: string }> {
    return request<{ message: string; id: string }>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSongActivity(songId: string): Promise<{ activities: SongActivityItem[] }> {
    return request<{ activities: SongActivityItem[] }>(
      `/songs/${encodeURIComponent(songId)}/activity`,
    );
  },
};
