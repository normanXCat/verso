import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authClient, AuthApiError } from '../../lib/auth-client.js';

export function ResetPasswordPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Jeton de réinitialisation manquant dans l'adresse de la page.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authClient.resetPassword({ token, newPassword });
      setMessage(res.message);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError('Impossible de mettre à jour le mot de passe.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="text-3xl font-extrabold font-mono tracking-wider text-emerald-400"
          >
            VERSO
          </Link>
          <h1 className="text-xl font-semibold text-slate-200">Nouveau mot de passe</h1>
          <p className="text-sm text-slate-400">
            Définissez un mot de passe sécurisé pour protéger vos œuvres.
          </p>
        </div>

        {message ? (
          <div className="p-4 text-sm rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-center space-y-2">
            <p>{message}</p>
            <p className="text-xs text-slate-400">Redirection vers la page de connexion...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label
                className="block text-xs font-medium text-slate-300 mb-1"
                htmlFor="newPassword"
              >
                Nouveau mot de passe
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Min. 8 car. avec 1 majuscule, 1 minuscule, 1 chiffre et 1 symbole.
              </p>
            </div>

            <div>
              <label
                className="block text-xs font-medium text-slate-300 mb-1"
                htmlFor="confirmPassword"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-950"
            >
              {isLoading ? 'Mise à jour...' : 'Enregistrer le nouveau mot de passe'}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
            ← Revenir à la page de connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
