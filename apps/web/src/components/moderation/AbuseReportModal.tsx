import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import type { ReportReason } from '@verso/shared';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { useToast } from '../ui/Toast.js';
import { moderationClient } from '../../lib/moderation-client.js';

export interface AbuseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: { id: string; displayName: string | null } | null;
  songId?: string;
  commentId?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: 'Harcèlement ou comportement déplacé' },
  { value: 'SPAM', label: 'Pollupostage (spam) ou sollicitation abusive' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Contenu inapproprié, violent ou diffamatoire' },
  { value: 'COPYRIGHT_INFRINGEMENT', label: 'Plagiat ou atteinte aux droits d’auteur' },
  { value: 'OTHER', label: 'Autre motif' },
];

export function AbuseReportModal({
  isOpen,
  onClose,
  targetUser,
  songId,
  commentId,
}: AbuseReportModalProps): React.ReactElement {
  const { toast } = useToast();
  const [reason, setReason] = useState<ReportReason>('HARASSMENT');
  const [details, setDetails] = useState('');

  const reportMutation = useMutation({
    mutationFn: () =>
      moderationClient.createReport({
        reason,
        details: details.trim() || undefined,
        reportedUserId: targetUser?.id,
        songId,
        commentId,
      }),
    onSuccess: () => {
      toast('Votre signalement a été transmis à l’équipe de modération.', 'success');
      setDetails('');
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Impossible de transmettre le signalement';
      toast(msg, 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Signaler un contenu ou un comportement"
      description="Les signalements sont traités confidentiellement par l'équipe de modération."
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {targetUser && (
          <div className="rounded-card border border-paper-border bg-paper-surface/50 p-3 text-xs text-paper-muted">
            Signalement concernant l'artiste :{' '}
            <strong className="text-paper-text font-medium">
              {targetUser.displayName || 'Artiste'}
            </strong>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="report-reason"
            className="text-xs font-mono uppercase tracking-wide text-paper-muted"
          >
            Motif du signalement
          </label>
          <select
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            className="w-full rounded border border-paper-border bg-paper-surface px-3 py-2 text-sm text-paper-text focus:border-paper-accent focus:outline-none"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="report-details"
            className="text-xs font-mono uppercase tracking-wide text-paper-muted"
          >
            Précisions complémentaires (optionnel)
          </label>
          <textarea
            id="report-details"
            rows={4}
            maxLength={2000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Décrivez les faits ou collez des extraits pertinents pour accélérer le traitement…"
            className="w-full rounded border border-paper-border bg-paper-surface p-2.5 text-sm text-paper-text placeholder:text-paper-muted focus:border-paper-accent focus:outline-none"
          />
          <div className="text-right text-[11px] text-paper-muted">
            {2000 - details.length} caractères restants
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-paper-border">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={reportMutation.isPending}
            loadingText="Transmission…"
            iconLeft={<Send />}
          >
            Envoyer le signalement
          </Button>
        </div>
      </form>
    </Modal>
  );
}
