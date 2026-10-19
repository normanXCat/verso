import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { NotificationItem } from '@verso/shared';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/ui/Toast.js';
import { notificationsClient, useNotificationsStream } from '../lib/notifications-stream.js';
import { NotificationDrawer } from '../components/notifications/NotificationDrawer.js';

interface NotificationsContextType {
  unreadCount: number;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setUnreadCount: (count: number) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger le compteur initial à la connexion
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;
    void notificationsClient
      .list({ limit: 1 })
      .then((res) => {
        if (isMounted) {
          setUnreadCount(res.unreadCount);
        }
      })
      .catch(() => {
        // Ignorer l'erreur réseau initiale
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleNewNotification = useCallback(
    (notification: NotificationItem) => {
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });

      const actor = notification.actor?.displayName ?? 'Un collaborateur';
      let message = `Nouvelle notification de ${actor}`;
      if (notification.type === 'INVITATION_RECEIVED') {
        message = `${actor} vous a invité à collaborer`;
      } else if (notification.type === 'MENTION') {
        message = `${actor} vous a mentionné`;
      } else if (notification.type === 'COMMENT_ADDED') {
        message = `${actor} a commenté votre texte`;
      } else if (notification.type === 'COMMENT_REPLY') {
        message = `${actor} a répondu à votre commentaire`;
      }

      toast(message, 'info');
    },
    [queryClient, toast],
  );

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // Écouteur SSE en temps réel
  useNotificationsStream({
    enabled: isAuthenticated,
    onNotification: handleNewNotification,
    onUnreadCountChange: handleUnreadCountChange,
  });

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  const toggleDrawer = () => setIsOpen((prev) => !prev);

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        isOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        setUnreadCount,
      }}
    >
      {children}
      {isAuthenticated && (
        <NotificationDrawer
          isOpen={isOpen}
          onClose={closeDrawer}
          onUnreadCountChange={setUnreadCount}
        />
      )}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextType {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé à l’intérieur d’un NotificationsProvider');
  }
  return context;
}
