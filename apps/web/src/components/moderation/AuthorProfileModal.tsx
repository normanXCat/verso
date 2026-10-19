import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Ban, Edit3, Loader2, Calendar } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../ui/Toast.js';
import { moderationClient } from '../../lib/moderation-client.js';

export interface AuthorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onBlock?: (userId: string, displayName: string | null) => void;
  onReport?: (userId: string, displayName: string | null) => void;
}

export function AuthorProfileModal({
  isOpen,
  onClose,
  userId,
  onBlock,
  onReport,
}: AuthorProfileModalProps): React.ReactElement {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isSelf = Boolean(currentUser && userId && currentUser.id === userId);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['users', 'profile', userId],
    queryFn: () => (userId ? moderationClient.getUserProfile(userId) : Promise.reject()),
    enabled: isOpen && Boolean(userId),
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () =>
      moderationClient.updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', 'profile', userId] });
      setIsEditing(false);
      toast('Votre profil a été mis à jour avec succès', 'success');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Impossible de mettre à jour le profil';
      toast(msg, 'error');
    },
  });

  const memberSince = profile?.createdAt
    ? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
        new Date(profile.createdAt),
      )
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsEditing(false);
        onClose();
      }}
      title={isSelf ? 'Mon profil artiste' : 'Profil artiste'}
      className="max-w-md"
    >
      <div className="space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-paper-muted">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement du profil…</span>
          </div>
        )}

        {isError && (
          <div className="rounded-card border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 text-center">
            Impossible de charger le profil de cet utilisateur (compte introuvable ou restreint).
          </div>
        )}

        {!isLoading && !isError && profile && (
          <div className="space-y-5">
            {/* Entête avec avatar et nom */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-paper-accent/10 border border-paper-accent/30 text-paper-accent font-serif text-2xl font-bold uppercase overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName || 'Artiste'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{(profile.displayName || 'A')[0]}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {isSelf && isEditing ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                    placeholder="Nom d'artiste"
                    className="w-full rounded border border-paper-border bg-paper-bg px-2.5 py-1 text-base font-semibold text-paper-text focus:border-paper-accent focus:outline-none"
                  />
                ) : (
                  <h3 className="truncate font-serif text-lg font-bold text-paper-text">
                    {profile.displayName || 'Artiste anonyme'}
                  </h3>
                )}

                {memberSince && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-paper-muted">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Membre depuis {memberSince}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Biographie */}
            <div className="rounded-card border border-paper-border bg-paper-surface/50 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wide text-paper-muted">
                  Biographie
                </span>
                {isSelf && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 text-xs text-paper-accent hover:underline"
                  >
                    <Edit3 className="h-3 w-3" />
                    Modifier
                  </button>
                )}
              </div>

              {isSelf && isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={280}
                    rows={4}
                    placeholder="Présentez votre univers musical, vos influences, votre collectif… (max 280 caractères)"
                    className="w-full rounded border border-paper-border bg-paper-bg p-2.5 text-sm text-paper-text placeholder:text-paper-muted focus:border-paper-accent focus:outline-none"
                  />
                  <div className="flex items-center justify-between text-xs text-paper-muted">
                    <span>{280 - bio.length} caractères restants</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setDisplayName(profile.displayName || '');
                          setBio(profile.bio || '');
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        isLoading={updateMutation.isPending}
                        loadingText="Enregistrement…"
                        onClick={() => updateMutation.mutate()}
                      >
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-paper-text whitespace-pre-wrap leading-relaxed">
                  {profile.bio || (
                    <span className="italic text-paper-muted">
                      Cet artiste n'a pas encore rédigé de biographie.
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Actions de modération (uniquement pour un tiers) */}
            {!isSelf && (
              <div className="flex items-center justify-between pt-2 border-t border-paper-border">
                {onReport && (
                  <button
                    type="button"
                    onClick={() => onReport(profile.id, profile.displayName)}
                    className="inline-flex items-center gap-1.5 text-xs text-paper-muted transition-colors hover:text-amber-600"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Signaler un abus
                  </button>
                )}

                {onBlock && (
                  <button
                    type="button"
                    onClick={() => onBlock(profile.id, profile.displayName)}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-500 transition-colors hover:text-rose-700 font-medium"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Bloquer cet artiste
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
