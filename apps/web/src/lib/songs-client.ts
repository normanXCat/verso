import { SearchSongsResult, SongFilter, SongSort } from '@verso/shared';

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

async function request<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

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
};
