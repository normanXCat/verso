import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../ui/Button.js';

export interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
}

export function NotificationBell({
  unreadCount,
  onClick,
  isOpen = false,
  className = '',
}: NotificationBellProps): React.ReactElement {
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        iconOnly
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        aria-expanded={isOpen}
        onClick={onClick}
        iconLeft={<Bell className="h-4 w-4" />}
      />

      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-paper-accent px-1 text-[10px] font-mono font-bold text-paper-bg ring-2 ring-paper-bg animate-in zoom-in-50 duration-200"
          aria-hidden="true"
        >
          {badgeLabel}
        </span>
      )}
    </div>
  );
}
