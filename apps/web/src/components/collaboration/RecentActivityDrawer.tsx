import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Edit3,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  UserPlus,
  LogOut,
  X,
  Loader2,
  Clock,
} from 'lucide-react';
import type { SongActivityItem } from '@verso/shared';
import { moderationClient } from '../../lib/moderation-client.js';

export interface RecentActivityDrawerProps {
  songId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectUser?: (userId: string) => void;
}

function formatActivityTime(value: Date | string): string {
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
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getActivityIcon(action: SongActivityItem['action']) {
  switch (action) {
    case 'create':
    case 'edit':
      return <Edit3 className="h-3.5 w-3.5 text-paper-accent" />;
    case 'restore':
      return <RotateCcw className="h-3.5 w-3.5 text-blue-500" />;
    case 'comment':
      return <MessageSquare className="h-3.5 w-3.5 text-amber-500" />;
    case 'resolve':
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case 'invite':
      return <UserPlus className="h-3.5 w-3.5 text-indigo-500" />;
    case 'leave':
      return <LogOut className="h-3.5 w-3.5 text-rose-500" />;
    default:
      return <Activity className="h-3.5 w-3.5 text-paper-muted" />;
  }
}

export function RecentActivityDrawer({
  songId,
  isOpen,
  onClose,
  onSelectUser,
}: RecentActivityDrawerProps): React.ReactElement {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['songs', songId, 'activity'],
    queryFn: () => moderationClient.getSongActivity(songId),
    enabled: isOpen && songId.length > 0,
    refetchInterval: isOpen ? 10000 : false,
  });

  const activities = data?.activities || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Activité récente du texte"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-paper-border bg-paper-surface shadow-2xl"
          >
            {/* Entête */}
            <header className="flex items-center justify-between border-b border-paper-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-paper-accent" aria-hidden="true" />
                <h3 className="font-serif text-lg text-paper-text">Activité récente</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="rounded-paper p-1 text-paper-muted hover:bg-paper-bg hover:text-paper-text"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-5">
              {isLoading && (
                <div className="flex items-center justify-center py-16 text-paper-muted">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Chargement de l'activité…</span>
                </div>
              )}

              {isError && (
                <div className="rounded-card border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600">
                  Impossible de charger l'historique d'activité de ce texte.
                </div>
              )}

              {!isLoading && !isError && activities.length === 0 && (
                <div className="rounded-card border border-dashed border-paper-border p-8 text-center text-paper-muted">
                  <Clock className="mx-auto h-8 w-8 text-paper-muted/60 mb-2" />
                  <p className="text-sm">Aucune activité récente sur ce texte.</p>
                </div>
              )}

              {!isLoading && !isError && activities.length > 0 && (
                <div className="relative border-l border-paper-border/80 ml-3.5 space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative pl-6">
                      {/* Pastille icône sur la ligne de temps */}
                      <span className="absolute -left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-paper-border bg-paper-surface shadow-xs">
                        {getActivityIcon(activity.action)}
                      </span>

                      <div className="space-y-1">
                        {/* Auteur et horodatage */}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectUser && onSelectUser(activity.actor.id)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-paper-text hover:text-paper-accent transition-colors truncate"
                          >
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-paper-border text-[9px] font-bold overflow-hidden">
                              {activity.actor.avatarUrl ? (
                                <img
                                  src={activity.actor.avatarUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                (activity.actor.displayName || 'A')[0].toUpperCase()
                              )}
                            </span>
                            <span className="truncate">
                              {activity.actor.displayName || 'Artiste'}
                            </span>
                          </button>

                          <time className="shrink-0 text-[11px] font-mono text-paper-muted">
                            {formatActivityTime(activity.timestamp)}
                          </time>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-paper-muted leading-relaxed">
                          {activity.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
