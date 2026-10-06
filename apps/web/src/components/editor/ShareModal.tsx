import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Download, Link2, Share2, Trash2 } from 'lucide-react';
import type { CreatedShareLink, ShareLinkItem } from '@verso/shared';
import { shareClient } from '../../lib/share-client.js';
import { Button } from '../ui/Button.js';
import { Modal } from '../ui/Modal.js';
import { useToast } from '../ui/Toast.js';

interface ShareModalProps {
  songId: string;
  songTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const EXPIRY_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Sans expiration', value: null },
  { label: '7 jours', value: 7 },
  { label: '30 jours', value: 30 },
  { label: '90 jours', value: 90 },
];

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(value: Date | string | null): string {
  if (!value) {
    return '—';
  }
  return dateFormatter.format(value instanceof Date ? value : new Date(value));
}

function buildFallbackFilename(title: string): string {
  const slug =
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'texte';
  const stamp = new Date().toISOString().slice(0, 10);
  return `${slug}-verso-${stamp}.pdf`;
}

function linkStatus(link: ShareLinkItem): { label: string; className: string } {
  if (link.isRevoked) {
    return { label: 'Révoqué', className: 'text-paper-muted' };
  }
  if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) {
    return { label: 'Expiré', className: 'text-paper-muted' };
  }
  return { label: 'Actif', className: 'text-emerald-600' };
}

/**
 * Modale de partage : export PDF horodaté et gestion des liens privés en
 * lecture seule (création avec expiration, copie, révocation immédiate).
 */
export function ShareModal({
  songId,
  songTitle,
  isOpen,
  onClose,
}: ShareModalProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7);
  const [createdLink, setCreatedLink] = useState<CreatedShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: links } = useQuery({
    queryKey: ['songs', 'share-links', songId],
    queryFn: () => shareClient.list(songId),
    enabled: isOpen && songId.length > 0,
  });

  const invalidateLinks = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['songs', 'share-links', songId] });
  };

  const createMutation = useMutation({
    mutationFn: () => shareClient.create(songId, { expiresInDays }),
    onSuccess: (link) => {
      setCreatedLink(link);
      setCopied(false);
      invalidateLinks();
      toast('Lien privé créé. Copiez-le maintenant : il ne sera plus affiché ensuite.', 'success');
    },
    onError: () => toast('Impossible de créer le lien de partage.', 'error'),
  });

  const revokeMutation = useMutation({
    mutationFn: (linkId: string) => shareClient.revoke(songId, linkId),
    onSuccess: (_result, linkId) => {
      if (createdLink?.id === linkId) {
        setCreatedLink(null);
      }
      invalidateLinks();
      toast('Lien révoqué. Toute ouverture ultérieure échouera.', 'success');
    },
    onError: () => toast('Impossible de révoquer ce lien.', 'error'),
  });

  const pdfMutation = useMutation({
    mutationFn: () => shareClient.downloadPdf(songId, buildFallbackFilename(songTitle)),
    onSuccess: () => toast('Export PDF horodaté téléchargé.', 'success'),
    onError: () => toast("Impossible de générer l'export PDF.", 'error'),
  });

  const copyLink = async (): Promise<void> => {
    if (!createdLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(createdLink.shareUrl);
      setCopied(true);
      toast('Lien copié dans le presse-papiers.', 'success');
    } catch {
      toast('Copie impossible : sélectionnez le lien manuellement.', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Partager ce texte"
      description="Lien privé en lecture seule, révocable à tout moment. L'email et l'identifiant de votre compte ne sont jamais exposés."
    >
      <div className="space-y-5">
        {/* Export PDF horodaté */}
        <section className="rounded-card border border-paper-border bg-paper-bg p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-serif text-base text-paper-text">Certificat d'antériorité</h4>
              <p className="mt-0.5 text-xs text-paper-muted">
                PDF sobre avec titre, paroles, auteur et horodatage exact de la dernière révision.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={pdfMutation.isPending}
              loadingText="Génération…"
              iconLeft={<Download />}
              onClick={() => pdfMutation.mutate()}
            >
              Exporter en PDF
            </Button>
          </div>
        </section>

        {/* Création d'un lien */}
        <section className="rounded-card border border-paper-border bg-paper-bg p-4">
          <label
            htmlFor="share-expiry"
            className="text-xs font-mono uppercase tracking-wide text-paper-muted"
          >
            Expiration du lien
          </label>
          <div className="mt-2 flex items-center gap-2">
            <select
              id="share-expiry"
              value={expiresInDays === null ? 'never' : String(expiresInDays)}
              onChange={(event) =>
                setExpiresInDays(event.target.value === 'never' ? null : Number(event.target.value))
              }
              className="rounded-paper border border-paper-border bg-paper-surface px-3 py-2 text-sm text-paper-text focus:border-paper-accent focus:outline-none"
            >
              {EXPIRY_OPTIONS.map((option) => (
                <option key={option.label} value={option.value === null ? 'never' : option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              isLoading={createMutation.isPending}
              loadingText="Création…"
              iconLeft={<Link2 />}
              onClick={() => createMutation.mutate()}
            >
              Générer un lien privé
            </Button>
          </div>

          {createdLink && (
            <div className="mt-3 rounded-paper border border-paper-accent/40 bg-paper-accent/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-paper-accent">
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Lien créé — copiez-le maintenant
                </span>
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="inline-flex items-center gap-1 rounded-paper border border-paper-accent/50 px-2 py-1 text-xs text-paper-accent transition-colors hover:bg-paper-accent/10"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
              <p className="mt-2 break-all font-mono text-[11px] text-paper-text">
                {createdLink.shareUrl}
              </p>
            </div>
          )}
        </section>

        {/* Liens existants */}
        <section>
          <h4 className="mb-2 font-serif text-base text-paper-text">Liens existants</h4>
          {!links || links.length === 0 ? (
            <p className="text-xs text-paper-muted">Aucun lien de partage pour ce texte.</p>
          ) : (
            <ul className="space-y-2">
              {links.map((link) => {
                const status = linkStatus(link);
                return (
                  <li
                    key={link.id}
                    className="flex items-center justify-between gap-3 rounded-card border border-paper-border bg-paper-surface px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-paper-text">
                        Créé le {formatDate(link.createdAt)}
                        {link.expiresAt ? ` · expire le ${formatDate(link.expiresAt)}` : ''}
                      </p>
                      <p className="mt-0.5 text-[11px] font-mono text-paper-muted">
                        <span className={status.className}>{status.label}</span>
                        {' · '}
                        {link.accessCount} consultation{link.accessCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    {!link.isRevoked && (
                      <button
                        type="button"
                        onClick={() => revokeMutation.mutate(link.id)}
                        disabled={revokeMutation.isPending}
                        className="inline-flex shrink-0 items-center gap-1 rounded-paper border border-rose-900/40 px-2 py-1 text-xs text-rose-500 transition-colors hover:bg-rose-950/20 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Révoquer
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}

export default ShareModal;
