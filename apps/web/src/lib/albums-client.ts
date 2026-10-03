import type { AlbumDetail, AlbumListItem, CreateAlbumInput, UpdateAlbumInput } from '@verso/shared';

const API_BASE_URL = '/api';

export class AlbumsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'AlbumsApiError';
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
    throw new AlbumsApiError(
      (data as { message?: string }).message || `Erreur requête (${response.status})`,
      response.status,
    );
  }

  return data as T;
}

export const albumsClient = {
  async list(): Promise<AlbumListItem[]> {
    return request<AlbumListItem[]>('/albums');
  },

  async get(id: string): Promise<AlbumDetail> {
    return request<AlbumDetail>(`/albums/${encodeURIComponent(id)}`);
  },

  async create(payload: CreateAlbumInput): Promise<AlbumDetail> {
    return request<AlbumDetail>('/albums', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, payload: UpdateAlbumInput): Promise<AlbumDetail> {
    return request<AlbumDetail>(`/albums/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async remove(id: string): Promise<void> {
    await request<void>(`/albums/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async addTrack(id: string, songId: string): Promise<AlbumDetail> {
    return request<AlbumDetail>(`/albums/${encodeURIComponent(id)}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ songId }),
    });
  },

  async removeTrack(id: string, songId: string): Promise<void> {
    await request<void>(`/albums/${encodeURIComponent(id)}/tracks/${encodeURIComponent(songId)}`, {
      method: 'DELETE',
    });
  },

  async reorder(id: string, songIds: string[]): Promise<AlbumDetail> {
    return request<AlbumDetail>(`/albums/${encodeURIComponent(id)}/tracks/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ songIds }),
    });
  },
};
