import React, { useState } from 'react';
import type { CollaboratorRole } from '@verso/shared';
import { UserPlus, Shield, Info } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';

export interface InviteCollaboratorFormProps {
  onInvite: (recipient: string, role: CollaboratorRole, expiresInDays?: number) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const ROLE_OPTIONS: Array<{
  value: CollaboratorRole;
  label: string;
  description: string;
}> = [
  {
    value: 'CO_AUTHOR',
    label: 'Co-auteur',
    description:
      'Écriture des paroles, gestion des instrumentales audio et résolution de commentaires.',
  },
  {
    value: 'COMMENTER',
    label: 'Commentateur',
    description: 'Lecture du texte, ajout de commentaires ancrés et réponses.',
  },
  {
    value: 'READER',
    label: 'Lecteur',
    description: 'Lecture seule du texte et écoute des instrumentales.',
  },
];

export function InviteCollaboratorForm({
  onInvite,
  isLoading = false,
  error = null,
}: InviteCollaboratorFormProps): React.ReactElement {
  const [recipient, setRecipient] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('CO_AUTHOR');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmed = recipient.trim();
    if (!trimmed) {
      setLocalError("Veuillez saisir un nom d'artiste ou une adresse email");
      return;
    }

    try {
      await onInvite(trimmed, role);
      setRecipient('');
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'invitation");
    }
  };

  const displayError = error || localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="invite-recipient"
          className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5"
        >
          Destinataire
        </label>
        <Input
          id="invite-recipient"
          type="text"
          placeholder="ex: McArtiste ou artiste@verso.fr"
          value={recipient}
          onChange={(e) => {
            setRecipient(e.target.value);
            if (localError) setLocalError(null);
          }}
          disabled={isLoading}
          required
        />
        <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
          <Info className="h-3 w-3 shrink-0" />
          Recherche par nom d’artiste exact ou adresse email
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
          Rôle attribué
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRole(opt.value)}
              className={`flex flex-col text-left p-3 rounded-lg border transition-colors ${
                role === opt.value
                  ? 'border-accent bg-accent/10 text-text-primary'
                  : 'border-border bg-surface-card hover:bg-surface-elevated text-text-secondary'
              }`}
            >
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-accent" />
                {opt.label}
              </span>
              <span className="text-xs text-text-muted mt-1 leading-snug">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      {displayError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          {displayError}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-text-muted">
          Invitation sécurisée, valide pendant 7 jours
        </span>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          iconLeft={<UserPlus className="h-4 w-4" />}
        >
          Envoyer l'invitation
        </Button>
      </div>
    </form>
  );
}
