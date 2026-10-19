import React from 'react';
import type { ParticipantInfo } from '../../lib/useRealtimeEditor.js';

interface CollaboratorPresenceBadgeProps {
  participants: ParticipantInfo[];
  isConnected: boolean;
  onSelectUser?: (userId: string) => void;
  className?: string;
}

export function CollaboratorPresenceBadge({
  participants,
  isConnected,
  onSelectUser,
  className = '',
}: CollaboratorPresenceBadgeProps): React.ReactElement {
  if (!isConnected && participants.length === 0) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-neutral-400 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-neutral-400 opacity-60" />
        <span className="hidden sm:inline">Hors ligne</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      aria-label="Collaborateurs connectés en direct"
    >
      <div className="flex -space-x-1.5 overflow-hidden py-1">
        {participants.map((p) => {
          const initials = (p.displayName || 'Artiste')
            .split(' ')
            .map((s) => s[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <button
              key={p.userId}
              type="button"
              onClick={() => onSelectUser?.(p.userId)}
              title={`${p.displayName} (En direct)`}
              className="relative rounded-full transition-transform hover:scale-110 hover:z-10 focus:outline-none"
              style={{ boxShadow: `0 0 0 2px ${p.color}` }}
            >
              {p.avatarUrl ? (
                <img
                  src={p.avatarUrl}
                  alt={p.displayName}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-sm"
                  style={{ backgroundColor: p.color }}
                >
                  {initials}
                </div>
              )}
              {/* Point vert présence en ligne */}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="hidden md:inline">
          {participants.length === 1
            ? '1 artiste connecté'
            : `${participants.length} artistes connectés`}
        </span>
      </div>
    </div>
  );
}
