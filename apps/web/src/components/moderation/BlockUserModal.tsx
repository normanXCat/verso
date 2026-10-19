import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { useToast } from '../ui/Toast.js';
import { moderationClient } from '../../lib/moderation-client.js';

export interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: { id: string; displayName: string | null } | null;
  onBlocked?: () => void;
}

export function BlockUserModal({
  isOpen,
  onClose,
  targetUser,
  onBlocked,
}: BlockUserModalProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const blockMutation = useMutation({
    mutationFn: () => {
      if (!targetUser) throw new Error('Utilisateur non spécifié');
      return moderationClient.blockUser(targetUser.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', 'blocked'] });
      void queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      void queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast(
        `L’utilisateur a été bloqué. Vos accès respectifs ont été révoqués immédiatement.`,
        'success',
      );
      if (onBlocked) onBlocked();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Impossible de bloquer cet utilisateur';
      toast(msg, 'error');
    },
  });

  return (
    <Modal
      isOpen={isOpen && Boolean(targetUser)}
      onClose={onClose}
      title="Bloquer cet artiste"
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="rounded-card border border-rose-500/20 bg-rose-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="text-xs text-paper-text leading-relaxed space-y-2">
              <p>
                Vous êtes sur le point de bloquer{' '}
                <strong className="text-paper-accent">
                  {targetUser?.displayName || 'cet artiste'}
                </strong>
                .
              </p>
              <ul className="list-disc pl-4 space-y-1 text-paper-muted">
                <li>Ses accès à toutes vos œuvres seront immédiatement révoqués.</li>
                <li>Vous serez retiré de toutes ses œuvres.</li>
                <li>Toutes les invitations mutuelles en attente seront annulées.</li>
                <li>Il ne pourra plus vous mentionner ni vous envoyer d'invitation.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-paper-border">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={blockMutation.isPending}
            loadingText="Blocage en cours…"
            iconLeft={<Ban />}
            onClick={() => blockMutation.mutate()}
          >
            Bloquer définitivement
          </Button>
        </div>
      </div>
    </Modal>
  );
}
