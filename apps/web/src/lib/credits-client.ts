import type { CreditRole, UpdateSongCreditsInput } from '@verso/shared';

export interface SongCreditItem {
  id?: string;
  songId?: string;
  userId?: string | null;
  name: string;
  role: CreditRole;
  percentage?: number | null;
  order: number;
}

export interface SongCreditsResponse {
  credits: SongCreditItem[];
  totalAuthorPercentage: number;
}

const API_BASE_URL = '/api';

export class CreditsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'CreditsApiError';
  }
}

export const creditsClient = {
  async getCredits(songId: string): Promise<SongCreditsResponse> {
    const res = await fetch(`${API_BASE_URL}/songs/${encodeURIComponent(songId)}/credits`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new CreditsApiError(err.message || 'Erreur lors du chargement des crédits', res.status);
    }
    return res.json();
  },

  async updateCredits(songId: string, data: UpdateSongCreditsInput): Promise<SongCreditsResponse> {
    const res = await fetch(`${API_BASE_URL}/songs/${encodeURIComponent(songId)}/credits`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new CreditsApiError(
        err.message || 'Erreur lors de la mise à jour des crédits',
        res.status,
      );
    }
    return res.json();
  },
};
