import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  CornerDownRight,
  MessageSquare,
  AtSign,
  UserPlus,
  AlertTriangle,
  X,
  Settings,
  ArrowLeft,
  Mail,
  Smartphone,
} from 'lucide-react';
import type {
  NotificationItem,
  NotificationSettings,
  NotificationType,
  UpdateNotificationSettingsInput,
} from '@verso/shared';
import { notificationsClient } from '../../lib/notifications-stream.js';
import { Button } from '../ui/Button.js';
import { useToast } from '../ui/Toast.js';

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

function formatNotificationTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'INVITATION_RECEIVED':
    case 'INVITATION_ACCEPTED':
    case 'INVITATION_DECLINED':
      return <UserPlus className="h-4 w-4 text-emerald-500" />;
    case 'COMMENT_ADDED':
      return <MessageSquare className="h-4 w-4 text-paper-accent" />;
    case 'COMMENT_REPLY':
      return <CornerDownRight className="h-4 w-4 text-sky-500" />;
    case 'MENTION':
      return <AtSign className="h-4 w-4 text-amber-500" />;
    case 'CONFLICT_DETECTED':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default:
      return <Bell className="h-4 w-4 text-paper-muted" />;
  }
}

function getNotificationMessage(item: NotificationItem): string {
  const actor = item.actor?.displayName ?? 'Un collaborateur';
  const targetTitle = item.target?.title ? ` « ${item.target.title} »` : '';

  switch (item.type) {
    case 'INVITATION_RECEIVED':
      return `${actor} vous a invité à collaborer sur${targetTitle}.`;
    case 'INVITATION_ACCEPTED':
      return `${actor} a accepté votre invitation sur${targetTitle}.`;
    case 'INVITATION_DECLINED':
      return `${actor} a décliné l'invitation sur${targetTitle}.`;
    case 'COMMENT_ADDED':
      return `${actor} a commenté${targetTitle}.`;
    case 'COMMENT_REPLY':
      return `${actor} a répondu à votre commentaire sur${targetTitle}.`;
    case 'MENTION':
      return `${actor} vous a mentionné dans une discussion sur${targetTitle}.`;
    case 'CONFLICT_DETECTED':
      return `Conflit détecté lors d'une modification concurrente sur${targetTitle}.`;
    default:
      return `Nouvelle activité de ${actor}${targetTitle}.`;
  }
}

export function NotificationDrawer({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationDrawerProps): React.ReactElement {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'settings'>('list');

  // Récupération des notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsClient.list({ limit: 40 }),
    enabled: isOpen,
    staleTime: 10_000,
  });

  // Récupération des préférences
  const { data: settingsData } = useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: () => notificationsClient.getSettings(),
    enabled: isOpen && view === 'settings',
  });

  const [formSettings, setFormSettings] = useState<NotificationSettings | null>(null);

  React.useEffect(() => {
    if (settingsData && !formSettings) {
      setFormSettings(settingsData);
    }
  }, [settingsData, formSettings]);

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsClient.markAsRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(
        ['notifications', 'list'],
        (old: { unreadCount: number; notifications: NotificationItem[] } | undefined) => {
          if (!old) return old;
          const wasUnread = old.notifications.find((n) => n.id === id)?.isRead === false;
          const newCount = wasUnread ? Math.max(0, old.unreadCount - 1) : old.unreadCount;
          onUnreadCountChange?.(newCount);
          return {
            unreadCount: newCount,
            notifications: old.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          };
        },
      );
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsClient.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(
        ['notifications', 'list'],
        (old: { unreadCount: number; notifications: NotificationItem[] } | undefined) => {
          if (!old) return old;
          onUnreadCountChange?.(0);
          return {
            unreadCount: 0,
            notifications: old.notifications.map((n) => ({ ...n, isRead: true })),
          };
        },
      );
      toast('Toutes les notifications sont marquées comme lues', 'success');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (input: UpdateNotificationSettingsInput) =>
      notificationsClient.updateSettings(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['notifications', 'settings'], updated);
      toast('Préférences de notification enregistrées', 'success');
      setView('list');
    },
    onError: () => {
      toast('Erreur lors de la mise à jour des réglages', 'error');
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id);
    }

    if (item.target?.songId || (item.target?.resourceType === 'song' && item.target?.resourceId)) {
      const songId = item.target.songId ?? item.target.resourceId;
      navigate(`/app/songs/${songId}`);
      onClose();
    } else if (item.type === 'INVITATION_RECEIVED') {
      navigate('/invitations');
      onClose();
    }
  };

  const handleSaveSettings = () => {
    if (!formSettings) return;
    updateSettingsMutation.mutate(formSettings);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Tiroir */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-paper-border bg-paper-surface shadow-paper-xl"
            aria-label="Tiroir de notifications"
          >
            {/* Entête */}
            <header className="flex items-center justify-between border-b border-paper-border px-6 py-4">
              <div className="flex items-center gap-3">
                {view === 'settings' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    iconOnly
                    aria-label="Retour aux notifications"
                    onClick={() => setView('list')}
                    iconLeft={<ArrowLeft className="h-4 w-4" />}
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-card bg-paper-surface-2 text-paper-accent">
                    <Bell className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <h2 className="font-serif text-lg font-medium text-paper-text">
                    {view === 'settings' ? 'Préférences' : 'Notifications'}
                  </h2>
                  <p className="text-xs text-paper-muted">
                    {view === 'settings'
                      ? 'Réglez vos alertes in-app et emails'
                      : unreadCount > 0
                        ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                        : 'À jour'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {view === 'list' && (
                  <>
                    {unreadCount > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconLeft={<CheckCheck className="h-3.5 w-3.5" />}
                        onClick={() => markAllAsReadMutation.mutate()}
                        title="Tout marquer comme lu"
                      >
                        Tout lire
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      iconOnly
                      aria-label="Réglages de notification"
                      onClick={() => setView('settings')}
                      iconLeft={<Settings className="h-4 w-4" />}
                    />
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  iconOnly
                  aria-label="Fermer"
                  onClick={onClose}
                  iconLeft={<X className="h-4 w-4" />}
                />
              </div>
            </header>

            {/* Corps du tiroir */}
            <div className="flex-1 overflow-y-auto p-4">
              {view === 'settings' ? (
                /* Vue Réglages */
                <div className="space-y-6">
                  {/* Alertes In-App */}
                  <div className="rounded-card border border-paper-border bg-paper-surface-2 p-4">
                    <div className="mb-3 flex items-center gap-2 font-medium text-paper-text text-sm">
                      <Smartphone className="h-4 w-4 text-paper-accent" />
                      <h3>Notifications dans l'application</h3>
                    </div>
                    <div className="space-y-3 text-xs">
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-paper-muted">Invitations reçues et réponses</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-paper-border text-paper-accent focus:ring-paper-accent"
                          checked={formSettings?.inApp.invitations ?? true}
                          onChange={(e) =>
                            setFormSettings((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    inApp: { ...prev.inApp, invitations: e.target.checked },
                                  }
                                : null,
                            )
                          }
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-paper-muted">Nouveaux commentaires</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-paper-border text-paper-accent focus:ring-paper-accent"
                          checked={formSettings?.inApp.comments ?? true}
                          onChange={(e) =>
                            setFormSettings((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    inApp: { ...prev.inApp, comments: e.target.checked },
                                  }
                                : null,
                            )
                          }
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-paper-muted">Mentions directes (@pseudonyme)</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-paper-border text-paper-accent focus:ring-paper-accent"
                          checked={formSettings?.inApp.mentions ?? true}
                          onChange={(e) =>
                            setFormSettings((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    inApp: { ...prev.inApp, mentions: e.target.checked },
                                  }
                                : null,
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>

                  {/* Alertes Emails Groupés */}
                  <div className="rounded-card border border-paper-border bg-paper-surface-2 p-4">
                    <div className="mb-2 flex items-center gap-2 font-medium text-paper-text text-sm">
                      <Mail className="h-4 w-4 text-paper-accent" />
                      <h3>Emails transactionnels</h3>
                    </div>
                    <p className="mb-4 text-[11px] text-paper-muted leading-relaxed">
                      Regroupés dans une fenêtre de 3 minutes pour préserver votre tranquillité.
                    </p>
                    <div className="space-y-3 text-xs">
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-paper-muted">Invitations à collaborer</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-paper-border text-paper-accent focus:ring-paper-accent"
                          checked={formSettings?.email.invitations ?? true}
                          onChange={(e) =>
                            setFormSettings((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    email: { ...prev.email, invitations: e.target.checked },
                                  }
                                : null,
                            )
                          }
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-paper-muted">Mentions directes (@pseudonyme)</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-paper-border text-paper-accent focus:ring-paper-accent"
                          checked={formSettings?.email.mentions ?? true}
                          onChange={(e) =>
                            setFormSettings((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    email: { ...prev.email, mentions: e.target.checked },
                                  }
                                : null,
                            )
                          }
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-paper-muted">Commentaires sur mes textes</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-paper-border text-paper-accent focus:ring-paper-accent"
                          checked={formSettings?.email.comments ?? false}
                          onChange={(e) =>
                            setFormSettings((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    email: { ...prev.email, comments: e.target.checked },
                                  }
                                : null,
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    fullWidth
                    onClick={handleSaveSettings}
                    isLoading={updateSettingsMutation.isPending}
                    loadingText="Enregistrement…"
                    iconLeft={<Check className="h-4 w-4" />}
                  >
                    Enregistrer les préférences
                  </Button>
                </div>
              ) : (
                /* Vue Liste des Notifications */
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-paper-muted">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-paper-accent border-t-transparent" />
                      <p className="mt-3 text-xs">Chargement des notifications…</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-paper-muted">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-surface-2 text-paper-muted">
                        <Bell className="h-6 w-6" />
                      </div>
                      <p className="mt-4 font-serif text-base text-paper-text">
                        Aucune notification
                      </p>
                      <p className="mt-1 max-w-xs text-xs text-paper-muted">
                        Vos invitations, mentions et commentaires apparaîtront ici.
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                        className={`group relative flex w-full items-start gap-3 rounded-card p-3 text-left transition-colors ${
                          item.isRead
                            ? 'bg-paper-surface hover:bg-paper-surface-2'
                            : 'bg-paper-surface-2/80 hover:bg-paper-surface-2 ring-1 ring-paper-border'
                        }`}
                      >
                        {/* Indicateur de lecture */}
                        {!item.isRead && (
                          <span
                            className="absolute top-4 left-1.5 h-1.5 w-1.5 rounded-full bg-paper-accent"
                            aria-label="Non lue"
                          />
                        )}

                        {/* Icône du type */}
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-card bg-paper-surface shadow-paper-sm">
                          {getNotificationIcon(item.type)}
                        </div>

                        {/* Contenu */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-relaxed text-paper-text">
                            {getNotificationMessage(item)}
                          </p>
                          <span className="mt-1 block text-[10px] font-mono text-paper-muted">
                            {formatNotificationTime(item.createdAt)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
