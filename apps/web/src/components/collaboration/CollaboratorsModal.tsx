import React, { useEffect, useState, useCallback } from 'react';
import type { CollaboratorItem, CollaboratorRole, InvitationItem } from '@verso/shared';
import { Users, Copy, Check, Trash2, Clock, LogOut, UserCheck, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { InviteCollaboratorForm } from './InviteCollaboratorForm.js';
import {
  collaborationClient,
  type CreateInvitationResponse,
} from '../../lib/collaboration-client.js';

export interface CollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: 'song' | 'album';
  resourceId: string;
  resourceTitle: string;
  isOwner: boolean;
  onLeft?: () => void;
  onSelectProfile?: (userId: string) => void;
}

export function CollaboratorsModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceTitle,
  isOwner,
  onLeft,
  onSelectProfile,
}: CollaboratorsModalProps): React.ReactElement {
  const [collaborators, setCollaborators] = useState<CollaboratorItem[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<InvitationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [latestInvite, setLatestInvite] = useState<CreateInvitationResponse | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'invite'>('members');

  const loadData = useCallback(async () => {
    if (!resourceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data =
        resourceType === 'song'
          ? await collaborationClient.getSongCollaborators(resourceId)
          : await collaborationClient.getAlbumCollaborators(resourceId);
      setCollaborators(data.collaborators);
      setPendingInvitations(data.pendingInvitations);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les collaborateurs');
    } finally {
      setIsLoading(false);
    }
  }, [resourceType, resourceId]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setLatestInvite(null);
      setSuccessMessage(null);
    }
  }, [isOpen, loadData]);

  const handleInvite = async (recipient: string, role: CollaboratorRole) => {
    setError(null);
    try {
      const invite =
        resourceType === 'song'
          ? await collaborationClient.inviteToSong(resourceId, { recipient, role })
          : await collaborationClient.inviteToAlbum(resourceId, { recipient, role });
      setLatestInvite(invite);
      setSuccessMessage(`Invitation envoyée avec succès à ${recipient}`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi de l'invitation";
      setError(msg);
      throw err;
    }
  };

  const handleRoleChange = async (userId: string, newRole: CollaboratorRole) => {
    setError(null);
    try {
      if (resourceType === 'song') {
        await collaborationClient.updateSongCollaboratorRole(resourceId, userId, newRole);
      } else {
        await collaborationClient.updateAlbumCollaboratorRole(resourceId, userId, newRole);
      }
      await loadData();
      setSuccessMessage('Rôle mis à jour');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de rôle');
    }
  };

  const handleRevoke = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir révoquer l’accès de ce collaborateur ?')) {
      return;
    }
    setError(null);
    try {
      if (resourceType === 'song') {
        await collaborationClient.revokeSongCollaborator(resourceId, userId);
      } else {
        await collaborationClient.revokeAlbumCollaborator(resourceId, userId);
      }
      await loadData();
      setSuccessMessage('Accès révoqué');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la révocation');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Voulez-vous vraiment quitter ce projet collaboratif ?')) {
      return;
    }
    setError(null);
    try {
      await collaborationClient.leaveCollaboration(resourceType, resourceId);
      onClose();
      if (onLeft) {
        onLeft();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du départ du projet');
    }
  };

  const copyToClipboard = (token: string) => {
    const inviteUrl = `${window.location.origin}/invitations/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Collaborateurs — ${resourceTitle}`}
      description={
        resourceType === 'song'
          ? 'Gérez les accès, les rôles et les invitations sur ce texte (limite de 10 collaborateurs).'
          : 'Les rôles attribués à l’album s’appliquent à l’ensemble de ses morceaux.'
      }
      className="max-w-xl"
    >
      <div className="space-y-4">
        {/* Onglets de navigation */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Users className="h-4 w-4" />
            Membres actifs ({collaborators.length})
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveTab('invite')}
              className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'invite'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              Inviter un collaborateur
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            {successMessage}
          </div>
        )}

        {/* Onglet : Membres actifs */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-center py-6 text-sm text-text-muted">Chargement des membres...</p>
            ) : collaborators.length === 0 ? (
              <p className="text-center py-6 text-sm text-text-muted">
                Aucun collaborateur actif sur cette œuvre pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {collaborators.map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectProfile && onSelectProfile(c.userId)}
                      className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity"
                    >
                      <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0 overflow-hidden">
                        {c.user?.avatarUrl ? (
                          <img
                            src={c.user.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          c.user?.displayName?.[0]?.toUpperCase() || 'A'
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium text-text-primary truncate hover:underline">
                          {c.user?.displayName || 'Artiste Verso'}
                        </p>
                        <p className="text-xs text-text-muted capitalize">
                          {c.role === 'CO_AUTHOR'
                            ? 'Co-auteur'
                            : c.role === 'COMMENTER'
                              ? 'Commentateur'
                              : 'Lecteur'}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <>
                          <select
                            value={c.role}
                            onChange={(e) =>
                              handleRoleChange(c.userId, e.target.value as CollaboratorRole)
                            }
                            className="bg-surface-card border border-border text-xs rounded-md px-2 py-1 text-text-primary focus:outline-hidden focus:border-accent"
                          >
                            <option value="CO_AUTHOR">Co-auteur</option>
                            <option value="COMMENTER">Commentateur</option>
                            <option value="READER">Lecteur</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevoke(c.userId)}
                            title="Révoquer l'accès"
                            className="text-text-muted hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated text-text-secondary border border-border">
                          {c.role}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Invitations en attente */}
            {isOwner && pendingInvitations.length > 0 && (
              <div className="pt-2 border-t border-border">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Invitations en attente ({pendingInvitations.length})
                </h4>
                <ul className="divide-y divide-border/60">
                  {pendingInvitations.map((inv) => (
                    <li key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-text-secondary">
                          {inv.invitedUser?.displayName || inv.invitedEmail || 'Destinataire'}
                        </p>
                        <p className="text-text-muted">
                          Rôle : {inv.role} • Expire le{' '}
                          {new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                        En attente
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action pour quitter le projet si non-propriétaire */}
            {!isOwner && (
              <div className="pt-4 border-t border-border flex justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleLeave}
                  iconLeft={<LogOut className="h-4 w-4" />}
                >
                  Quitter ce projet
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Onglet : Inviter */}
        {activeTab === 'invite' && isOwner && (
          <div className="space-y-4">
            <InviteCollaboratorForm onInvite={handleInvite} />

            {latestInvite && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                <p className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0" />
                  Lien d'invitation sécurisé prêt à partager :
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/invitations/${latestInvite.token}`}
                    className="w-full bg-surface-card border border-border text-xs px-2.5 py-1.5 rounded-md text-text-primary"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(latestInvite.token)}
                    iconLeft={
                      copiedToken === latestInvite.token ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {copiedToken === latestInvite.token ? 'Copié' : 'Copier'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
