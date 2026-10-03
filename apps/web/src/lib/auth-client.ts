import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UserPublic,
  SessionInfo,
} from '@verso/shared';

const API_BASE_URL = '/api/auth';

export class AuthApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: unknown,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AuthApiError(
      data.message || `Erreur requête (${response.status})`,
      response.status,
      data.errors,
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
