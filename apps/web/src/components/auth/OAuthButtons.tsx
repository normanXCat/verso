import React, { useState } from 'react';
import { authClient } from '../../lib/auth-client.js';
import { Button } from '../ui/Button.js';
import { GoogleIcon, OrcidIcon } from './OAuthIcons.js';

type OAuthProvider = 'google' | 'orcid';

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  orcid: 'ORCID',
};

/**
 * Boutons d'authentification tierce. La navigation est déléguée au serveur API,
 * qui construit l'URL d'autorisation avec `state` et PKCE.
 */
export function OAuthButtons(): React.ReactElement {
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  const startOAuth = (provider: OAuthProvider): void => {
    setPending(provider);
    window.location.assign(authClient.oauthStartUrl(provider));
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {(Object.keys(PROVIDER_LABELS) as OAuthProvider[]).map((provider) => {
        const label = PROVIDER_LABELS[provider];
        const isPending = pending === provider;

        return (
          <Button
            key={provider}
            type="button"
            variant="secondary"
            size="md"
            onClick={() => startOAuth(provider)}
            disabled={pending !== null}
            aria-label={`Se connecter avec ${label}`}
            isLoading={isPending}
            iconLeft={provider === 'google' ? <GoogleIcon /> : <OrcidIcon />}
            fullWidth
            className="px-2 sm:px-4 font-mono text-xs"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
