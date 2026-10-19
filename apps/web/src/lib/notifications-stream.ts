import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  NotificationItem,
  NotificationListResponse,
  NotificationSettings,
  UpdateNotificationSettingsInput,
} from '@verso/shared';

const API_BASE_URL = '/api';

export class NotificationsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'NotificationsApiError';
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
    throw new NotificationsApiError(
      (data as { message?: string }).message || `Erreur (${response.status})`,
      response.status,
    );
  }

  return data as T;
}

export const notificationsClient = {
  /**
   * Consulter les notifications de l'utilisateur
   */
  async list(params?: { unreadOnly?: boolean; limit?: number }): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.unreadOnly) {
      searchParams.set('unreadOnly', 'true');
    }
    if (params?.limit) {
      searchParams.set('limit', String(params.limit));
    }

    const query = searchParams.toString();
    const endpoint = `/notifications${query ? `?${query}` : ''}`;
    return request<NotificationListResponse>(endpoint);
  },

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(id: string): Promise<{ id: string; isRead: boolean }> {
    return request<{ id: string; isRead: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Marquer l'ensemble des notifications comme lues
   */
  async markAllAsRead(): Promise<{ markedCount: number }> {
    return request<{ markedCount: number }>('/notifications/read-all', {
      method: 'POST',
    });
  },

  /**
   * Obtenir les réglages de notification
   */
  async getSettings(): Promise<NotificationSettings> {
    return request<NotificationSettings>('/notifications/settings');
  },

  /**
   * Mettre à jour les préférences de notification
   */
  async updateSettings(settings: UpdateNotificationSettingsInput): Promise<NotificationSettings> {
    return request<NotificationSettings>('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

export interface UseNotificationsStreamOptions {
  enabled?: boolean;
  onNotification?: (notification: NotificationItem) => void;
  onUnreadCountChange?: (count: number) => void;
}

/**
 * Hook de connexion au flux Server-Sent Events (SSE) pour les notifications temps réel
 */
export function useNotificationsStream(options: UseNotificationsStreamOptions = {}) {
  const { enabled = true, onNotification, onUnreadCountChange } = options;
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleNotification = useCallback(
    (notification: NotificationItem) => {
      onNotification?.(notification);
    },
    [onNotification],
  );

  const handleUnreadCount = useCallback(
    (count: number) => {
      setUnreadCount(count);
      onUnreadCountChange?.(count);
    },
    [onUnreadCountChange],
  );

  useEffect(() => {
    if (!enabled) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let isCleanedUp = false;

    function connect() {
      if (isCleanedUp) return;

      try {
        const es = new EventSource('/api/notifications/stream', {
          withCredentials: true,
        });

        es.onopen = () => {
          if (!isCleanedUp) {
            setIsConnected(true);
          }
        };

        es.addEventListener('unread_count', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data) as { count: number };
            handleUnreadCount(data.count);
          } catch {
            // Ignore format error
          }
        });

        es.addEventListener('notification', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data) as NotificationItem;
            handleNotification(data);
          } catch {
            // Ignore format error
          }
        });

        es.onerror = () => {
          es.close();
          if (!isCleanedUp) {
            setIsConnected(false);
            // Reconnexion avec délai
            retryTimeout = setTimeout(connect, 5000);
          }
        };

        eventSourceRef.current = es;
      } catch {
        if (!isCleanedUp) {
          retryTimeout = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      isCleanedUp = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, handleNotification, handleUnreadCount]);

  return {
    unreadCount,
    setUnreadCount,
    isConnected,
  };
}
