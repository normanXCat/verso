import React from 'react';
import type { CollaboratorRole } from '@verso/shared';
import { PenTool, MessageSquare, Eye } from 'lucide-react';

export interface SharedBadgeProps {
  role: CollaboratorRole;
  ownerName?: string | null;
  className?: string;
}

const ROLE_CONFIG: Record<
  CollaboratorRole,
  { label: string; icon: React.ComponentType<{ className?: string }>; style: string }
> = {
  CO_AUTHOR: {
    label: 'Co-auteur',
    icon: PenTool,
    style: 'bg-accent/10 text-accent border-accent/20',
  },
  COMMENTER: {
    label: 'Commentateur',
    icon: MessageSquare,
    style: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  READER: {
    label: 'Lecteur',
    icon: Eye,
    style: 'bg-surface-elevated text-text-muted border-border',
  },
};

export function SharedBadge({
  role,
  ownerName,
  className = '',
}: SharedBadgeProps): React.ReactElement {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.READER;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${config.style} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{config.label}</span>
      {ownerName && (
        <span className="text-text-muted opacity-80 border-l border-current/20 pl-1.5 ml-0.5">
          de {ownerName}
        </span>
      )}
    </span>
  );
}
