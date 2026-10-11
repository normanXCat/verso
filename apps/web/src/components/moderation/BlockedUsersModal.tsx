import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Unlock, Loader2, UserX } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { useToast } from '../ui/Toast.js';
import { moderationClient, type BlockedUserItem } from '../../lib/moderation-client.js';

export interface BlockedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BlockedUsersModal({ isOpen, onClose }: BlockedUsersModalProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'blocked'],
    queryFn: () => moderationClient.getBlockedUsers(),
    enabled: isOpen,
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => moderationClient.unblockUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', 'blocked'] });
      void queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      toast('L’utilisateur a été débloqué avec succès.', 'success');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Impossible de débloquer l’utilisateur';
      toast(msg, 'error');
    },
  });

  const blockedUsers = data?.blockedUsers || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Utilisateurs bloqués"
      description="Les utilisateurs bloqués ne peuvent pas vous inviter, vous mentionner ou collaborer avec vous."
      className="max-w-md"
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-paper-muted">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Chargement des comptes bloqués…</span>
          </div>
        )}

        {!isLoading && blockedUsers.length === 0 && (
          <div className="rounded-card border border-dashed border-paper-border p-6 text-center text-paper-muted">
            <UserX className="mx-auto h-8 w-8 text-paper-muted/60 mb-2" />
            <p className="text-sm">Vous n'avez bloqué aucun artiste.</p>
          </div>
        )}

        {!isLoading && blockedUsers.length > 0 && (
          <div className="divide-y divide-paper-border max-h-80 overflow-y-auto">
            {blockedUsers.map((user: BlockedUserItem) => (
              <div key={user.id} className="flex items-center justify-between gap-3 py-3 px-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-surface border border-paper-border text-paper-text font-serif text-sm font-semibold">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName || 'Artiste'}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      (user.displayName || 'A')[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-paper-text">
                      {user.displayName || 'Artiste anonyme'}
                    </p>
                    <p className="text-[11px] text-paper-muted">
                      Bloqué le{' '}
                      {new Intl.DateTimeFormat('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }).format(new Date(user.blockedAt))}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  isLoading={unblockMutation.isPending}
                  iconLeft={<Unlock className="h-3.5 w-3.5" />}
                  onClick={() => unblockMutation.mutate(user.id)}
                >
                  Débloquer
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-paper-border">
          <Button type="button" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
