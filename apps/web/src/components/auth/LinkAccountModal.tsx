import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { authClient, AuthApiError } from '../../lib/auth-client.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../ui/Toast.js';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  orcid: 'ORCID',
};

/**
 * Modale affichée au retour d'un callback OAuth lorsqu'un compte email existe déjà.
 * La liaison exige la saisie du mot de passe du compte existant (protection anti-usurpation).
 */
export function LinkAccountModal(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { toast } = useToast();

  const isOpen = searchParams.get('oauth') === 'link_required';
  const linkToken = searchParams.get('linkToken') ?? '';
  const provider = searchParams.get('provider') ?? '';
  const providerLabel = PROVIDER_LABELS[provider] ?? provider;

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const close = (): void => {
    const next = new URLSearchParams(searchParams);
    next.delete('oauth');
    next.delete('linkToken');
    next.delete('provider');
    setSearchParams(next, { replace: true });
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authClient.linkOAuthAccount({ linkToken, password });
      await refreshUser();
      setIsSuccess(true);
      toast('Compte associé avec succès.', 'success');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 600);
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : "L'association du compte a échoué. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Associer ce compte"
      description={
        providerLabel
          ? `Connexion ${providerLabel} reconnue sur une adresse déjà utilisée par Verso.`
          : 'Un compte Verso existe déjà avec cette adresse.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-paper-muted leading-relaxed font-sans">
          Pour associer la connexion {providerLabel || 'externe'} à votre compte existant sans créer
          de doublon, confirmez votre identité en saisissant le mot de passe actuel de votre compte.
        </p>

        <Input
          label="Mot de passe du compte existant"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
        />

        {error && (
          <div className="p-3 rounded-lg border border-paper-accent/40 bg-paper-accent/10 text-xs font-mono text-paper-accent">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={close} disabled={isLoading}>
            Plus tard
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            loadingText="Vérification..."
            isSuccess={isSuccess}
            successText="Associé"
          >
            Associer le compte
          </Button>
        </div>
      </form>
    </Modal>
  );
}
