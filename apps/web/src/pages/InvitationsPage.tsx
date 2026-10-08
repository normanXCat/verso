import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Check, X, Shield, Clock, FileText, Disc3 } from 'lucide-react';
import type { InvitationItem } from '@verso/shared';
import { collaborationClient } from '../lib/collaboration-client.js';
import { Button } from '../components/ui/Button.js';
import { ThemeToggle } from '../components/common/ThemeToggle.js';
import { useToast } from '../components/ui/Toast.js';

export function InvitationsPage(): React.ReactElement {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [actionError, setActionError] = useState<string | null>(null);

  // Liste des invitations reçues par l'utilisateur connecté
  const {
    data: invitations,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['collaborations', 'user-invitations'],
    queryFn: () => collaborationClient.getUserInvitations(),
    enabled: !token,
  });

  const acceptMutation = useMutation({
    mutationFn: (tok: string) => collaborationClient.acceptInvitation(tok),
    onSuccess: (data) => {
      toast('Invitation acceptée avec succès !', 'success');
      void queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      if (data.collaborator.songId) {
        navigate(`/songs/${data.collaborator.songId}`);
      } else if (data.collaborator.albumId) {
        navigate(`/albums/${data.collaborator.albumId}`);
      } else {
        navigate('/shared-with-me');
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'acceptation";
      setActionError(msg);
      toast(msg, 'error');
    },
  });

  const declineMutation = useMutation({
    mutationFn: (tok: string) => collaborationClient.declineInvitation(tok),
    onSuccess: () => {
      toast('Invitation refusée.', 'info');
      void queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      if (token) {
        navigate('/app');
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erreur lors du refus';
      setActionError(msg);
      toast(msg, 'error');
    },
  });

  return (
    <div className="paper-grain min-h-screen bg-paper-bg text-paper-text">
      {/* En-tête */}
      <header className="sticky top-0 z-30 border-b border-paper-border bg-paper-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3 md:px-10">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-paper-muted transition-colors hover:text-paper-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Mon carnet
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/shared-with-me"
              className="text-xs font-mono text-paper-muted transition-colors hover:text-paper-text"
            >
              Partagés avec moi
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 md:px-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center text-accent">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-paper-text">
                {token ? 'Répondre à une invitation' : 'Invitations reçues'}
              </h1>
              <p className="text-xs font-mono text-paper-muted">
                {token
                  ? 'Rejoignez un projet collaboratif sur Verso'
                  : 'Gérez les demandes de collaboration en attente de réponse'}
              </p>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
            {actionError}
          </div>
        )}

        {/* Cas : Jeton dans l'URL (lien direct d'invitation) */}
        {token ? (
          <div className="rounded-card border border-paper-border bg-paper-surface/80 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Shield className="h-4 w-4 text-accent" />
              <span>Invitation sécurisée</span>
            </div>

            <div>
              <h2 className="font-serif text-xl font-bold text-paper-text">
                Vous avez été invité à collaborer
              </h2>
              <p className="mt-1 text-sm text-paper-muted">
                Acceptez cette invitation pour accéder au texte ou à l'album partagé et participer à
                sa création.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                loading={acceptMutation.isPending}
                onClick={() => acceptMutation.mutate(token)}
                iconLeft={<Check className="h-4 w-4" />}
              >
                Accepter l'invitation
              </Button>
              <Button
                variant="secondary"
                size="md"
                disabled={acceptMutation.isPending || declineMutation.isPending}
                loading={declineMutation.isPending}
                onClick={() => declineMutation.mutate(token)}
                iconLeft={<X className="h-4 w-4" />}
              >
                Refuser
              </Button>
            </div>
          </div>
        ) : (
          /* Cas : Liste des invitations en attente */
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-24 animate-pulse rounded-card border border-paper-border bg-paper-surface/60"
                  />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-card border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
                Impossible de charger vos invitations.
              </div>
            ) : !invitations || invitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-paper-border bg-paper-surface/50 px-6 py-16 text-center">
                <Mail className="mb-4 h-8 w-8 text-paper-muted" aria-hidden="true" />
                <p className="font-serif text-xl text-paper-text">Aucune invitation en attente</p>
                <p className="mt-1 text-xs text-paper-muted max-w-sm">
                  Toutes vos invitations ont été traitées ou ont expiré.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {invitations.map((inv: InvitationItem) => (
                  <li
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-card border border-paper-border bg-paper-surface/70 p-4 transition-colors hover:border-paper-accent/30"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {inv.song ? (
                          <FileText className="h-4 w-4 text-accent" />
                        ) : (
                          <Disc3 className="h-4 w-4 text-accent" />
                        )}
                        <span className="font-serif font-semibold text-paper-text">
                          {inv.song?.title || inv.album?.title || 'Œuvre partagée'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-accent/10 text-accent border border-accent/20">
                          {inv.role}
                        </span>
                      </div>
                      <p className="text-xs text-paper-muted">
                        Invité par{' '}
                        <strong className="text-text-primary">
                          {inv.inviter?.displayName || 'Un artiste'}
                        </strong>{' '}
                        • Expire le {new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Note : Pour les invitations listées sans le rawToken (qui est masqué côté serveur),
                          le tokenHash ou ID peut être résolu */}
                      <span className="text-xs flex items-center gap-1 text-amber-500 font-medium">
                        <Clock className="h-3 w-3" />
                        En attente
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default InvitationsPage;
