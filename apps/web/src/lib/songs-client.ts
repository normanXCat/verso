import {
  SearchSongsResult,
  SongFilter,
  SongDetail,
  SongSort,
  SongVersionItem,
  UpdateSongInput,
  type CreateSongInput,
} from '@verso/shared';

const API_BASE_URL = '/api';

export class SongsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'SongsApiError';
  }
}

export interface SearchSongsParams {
  q?: string;
  filter?: SongFilter;
  tag?: string;
  albumId?: string;
  sort?: SongSort;
  limit?: number;
  offset?: number;
}

export type CreateSongPayload = Partial<CreateSongInput>;

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
    throw new SongsApiError(
      (data as { message?: string }).message || `Erreur requête (${response.status})`,
      response.status,
    );
  }

  return data as T;
}

export const songsClient = {
  async search(params: SearchSongsParams = {}): Promise<SearchSongsResult> {
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (params.filter) search.set('filter', params.filter);
    if (params.tag) search.set('tag', params.tag);
    if (params.albumId) search.set('albumId', params.albumId);
    if (params.sort) search.set('sort', params.sort);
    if (params.limit !== undefined) search.set('limit', String(params.limit));
    if (params.offset !== undefined) search.set('offset', String(params.offset));

    const query = search.toString();
    return request<SearchSongsResult>(`/songs${query ? `?${query}` : ''}`);
  },

  async get(id: string): Promise<SongDetail> {
    return request<SongDetail>(`/songs/${encodeURIComponent(id)}`);
  },

  async create(payload: CreateSongPayload = {}): Promise<SongDetail> {
    return request<SongDetail>('/songs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, payload: UpdateSongInput): Promise<SongDetail> {
    return request<SongDetail>(`/songs/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async remove(id: string): Promise<void> {
    await request<void>(`/songs/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async versions(id: string): Promise<SongVersionItem[]> {
    return request<SongVersionItem[]>(`/songs/${encodeURIComponent(id)}/versions`);
  },

  async restoreVersion(id: string, versionId: string): Promise<SongDetail> {
    return request<SongDetail>(
      `/songs/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/restore`,
      { method: 'POST' },
    );
  },
};
