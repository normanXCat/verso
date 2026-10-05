import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  LinkOAuthAccountInput,
  UserPublic,
  SessionInfo,
} from '@verso/shared';

const API_BASE_URL = '/api/auth';

export class AuthApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: unknown,
    public retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

/**
 * Effectue une requête vers l'API d'authentification.
 * - Une coupure réseau (fetch qui rejette) devient un `AuthApiError` de statut 0.
 * - Le délai de rate limiting (`retry-after`) est conservé pour l'affichage.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    // Panne réseau : le serveur est injoignable (statut 0 conventionnel).
    throw new AuthApiError('Impossible de joindre le serveur', 0);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const retryAfter = Number(response.headers.get('retry-after'));
    throw new AuthApiError(
      data.message || `Erreur requête (${response.status})`,
      response.status,
      data.errors,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }

  return data as T;
}

export const authClient = {
  async register(data: RegisterInput): Promise<{ user: UserPublic; message: string }> {
    return request<{ user: UserPublic; message: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: LoginInput): Promise<{ user: UserPublic }> {
    return request<{ user: UserPublic }>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<{ message: string }> {
    return request<{ message: string }>('/logout', {
      method: 'POST',
    });
  },

  async getMe(): Promise<{ user: UserPublic }> {
    return request<{ user: UserPublic }>('/me', {
      method: 'GET',
    });
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });
  },

  async resendVerification(): Promise<{ message: string }> {
    return request<{ message: string }>('/resend-verification', {
      method: 'POST',
    });
  },

  async forgotPassword(data: ForgotPasswordInput): Promise<{ message: string }> {
    return request<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    return request<{ message: string }>('/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** URL de démarrage du flux OAuth (redirection navigateur vers le fournisseur). */
  oauthStartUrl(provider: 'google' | 'orcid'): string {
    return `${API_BASE_URL}/oauth/${provider}`;
  },

  async linkOAuthAccount(data: LinkOAuthAccountInput): Promise<{ user: UserPublic }> {
    return request<{ user: UserPublic }>('/oauth/link-confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSessions(): Promise<SessionInfo[]> {
    return request<SessionInfo[]>('/sessions', {
      method: 'GET',
    });
  },

  async revokeSession(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async revokeAllSessions(allExceptCurrent: boolean = true): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/sessions${allExceptCurrent ? '?allExceptCurrent=true' : ''}`,
      {
        method: 'DELETE',
      },
    );
  },
};
