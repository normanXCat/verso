import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authClient } from '../../lib/auth-client.js';

type OAuthProvider = 'google' | 'orcid';

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  orcid: 'ORCID',
};

function GoogleIcon(): React.ReactElement {
  return (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}

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
    <div className="grid grid-cols-2 gap-3">
      {(Object.keys(PROVIDER_LABELS) as OAuthProvider[]).map((provider) => {
        const isPending = pending === provider;
        const isDisabled = pending !== null;

        return (
          <button
            key={provider}
            type="button"
            onClick={() => startOAuth(provider)}
            disabled={isDisabled}
            aria-label={`Se connecter avec ${PROVIDER_LABELS[provider]}`}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-paper-border bg-paper-surface text-xs font-mono text-paper-text transition-colors duration-paper hover:border-paper-muted hover:bg-paper-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-paper-muted" aria-hidden="true" />
            ) : provider === 'google' ? (
              <GoogleIcon />
            ) : (
              <span
                className="font-serif font-bold text-sm leading-none text-paper-accent"
                aria-hidden="true"
              >
                iD
              </span>
            )}
            <span>{PROVIDER_LABELS[provider]}</span>
          </button>
        );
      })}
    </div>
  );
}
