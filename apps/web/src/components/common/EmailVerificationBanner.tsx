import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { authClient, AuthApiError } from '../../lib/auth-client.js';

export function EmailVerificationBanner(): React.ReactElement | null {
  const { user, isAuthenticated, isEmailVerified } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isAuthenticated || !user || isEmailVerified) {
    return null;
  }

  const handleResend = async () => {
    setStatus('loading');
    setFeedback(null);

    try {
      const res = await authClient.resendVerification();
      setStatus('success');
      setFeedback(res.message);
      setTimeout(() => {
        setStatus('idle');
        setFeedback(null);
      }, 5000);
    } catch (err) {
      setStatus('error');
      if (err instanceof AuthApiError) {
        setFeedback(err.message);
      } else {
        setFeedback("Impossible de renvoyer l'email pour le moment.");
      }
      setTimeout(() => {
        setStatus('idle');
        setFeedback(null);
      }, 5000);
    }
  };

  return (
    <aside
      aria-label="Avertissement de vérification d'email"
      className="w-full bg-amber-950/80 border-b border-amber-800/80 px-4 py-2.5 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>
          Votre adresse email (<strong>{user.email}</strong>) n'a pas encore été vérifiée. Consultez
          vos courriers indésirables pour activer la récupération complète de votre compte.
        </span>
      </div>

      <div className="flex items-center gap-3">
        {feedback && (
          <span
            className={
              status === 'success' ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'
            }
          >
            {feedback}
          </span>
        )}

        <button
          onClick={handleResend}
          disabled={status === 'loading'}
          className="px-3 py-1 rounded bg-amber-900/60 hover:bg-amber-800/80 border border-amber-700/80 text-amber-100 font-medium transition-colors disabled:opacity-50 text-[11px]"
        >
          {status === 'loading' ? 'Envoi...' : "Renvoyer l'email"}
        </button>
      </div>
    </aside>
  );
}
