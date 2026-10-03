import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authClient, AuthApiError } from '../../lib/auth-client.js';
import { useAuth } from '../../hooks/useAuth.js';

export function VerifyEmailPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien de vérification invalide ou manquant.');
      return;
    }

    let isMounted = true;
    authClient
      .verifyEmail(token)
      .then((res) => {
        if (isMounted) {
          setStatus('success');
          setMessage(res.message);
          refreshUser().catch(() => null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStatus('error');
          if (err instanceof AuthApiError) {
            setMessage(err.message);
          } else {
            setMessage('Échec de la validation de votre adresse email.');
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, refreshUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-center space-y-6">
        <Link to="/" className="text-3xl font-extrabold font-mono tracking-wider text-emerald-400">
          VERSO
        </Link>

        <h1 className="text-xl font-semibold text-slate-200">Validation de votre adresse email</h1>

        {status === 'loading' && (
          <div className="py-8 space-y-3">
            <div className="w-8 h-8 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Vérification de votre jeton en cours...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm">
              {message}
            </div>
            <p className="text-xs text-slate-400">
              Votre compte est désormais pleinement vérifié. Toutes les alertes de confirmation sont
              levées.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-block py-2.5 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-950"
              >
                Accéder à mon espace d'écriture
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm">
              {message}
            </div>
            <p className="text-xs text-slate-400">
              Le lien a peut-être expiré ou a déjà été utilisé.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-block py-2.5 px-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
