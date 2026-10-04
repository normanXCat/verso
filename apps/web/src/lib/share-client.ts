import type {
  CreateShareLinkInput,
  CreatedShareLink,
  PublicSharedSong,
  ShareLinkItem,
} from '@verso/shared';

const API_BASE_URL = '/api';

export class ShareApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ShareApiError';
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
    throw new ShareApiError(
      (data as { message?: string }).message || `Erreur requête (${response.status})`,
      response.status,
    );
  }

  return data as T;
}

/** Extrait le nom de fichier proposé par l'en-tête `Content-Disposition`. */
function filenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) {
    return null;
  }
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return match?.[1] ?? null;
}

export const shareClient = {
  async list(songId: string): Promise<ShareLinkItem[]> {
    return request<ShareLinkItem[]>(`/songs/${encodeURIComponent(songId)}/share-links`);
  },

  async create(songId: string, payload: CreateShareLinkInput = {}): Promise<CreatedShareLink> {
    return request<CreatedShareLink>(`/songs/${encodeURIComponent(songId)}/share-links`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async revoke(songId: string, linkId: string): Promise<void> {
    await request<void>(
      `/songs/${encodeURIComponent(songId)}/share-links/${encodeURIComponent(linkId)}`,
      { method: 'DELETE' },
    );
  },

  /** Consultation anonyme : aucun cookie de session n'est transmis. */
  async getPublic(token: string): Promise<PublicSharedSong> {
    const response = await fetch(`${API_BASE_URL}/public/shares/${encodeURIComponent(token)}`, {
      credentials: 'omit',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ShareApiError(
        (data as { message?: string }).message || "Ce lien n'est plus actif",
        response.status,
      );
    }
    return data as PublicSharedSong;
  },

  /** Télécharge le certificat PDF horodaté et déclenche l'enregistrement navigateur. */
  async downloadPdf(songId: string, fallbackFilename: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/songs/${encodeURIComponent(songId)}/export/pdf`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new ShareApiError("Impossible de générer l'export PDF", response.status);
    }

    const blob = await response.blob();
    const filename =
      filenameFromDisposition(response.headers.get('content-disposition')) ?? fallbackFilename;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
};
