import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authClient, AuthApiError } from '../../lib/auth-client.js';

export function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await authClient.forgotPassword({ email });
      setMessage(res.message);
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError("Impossible d'envoyer la demande de réinitialisation.");
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
          <h1 className="text-xl font-semibold text-slate-200">Mot de passe oublié</h1>
          <p className="text-sm text-slate-400">
            Saisissez votre email pour recevoir un lien temporaire de réinitialisation.
          </p>
        </div>

        {message ? (
          <div className="space-y-4">
            <div className="p-4 text-sm rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300">
              {message}
            </div>
            <div className="text-center">
              <Link
                to="/login"
                className="inline-block py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="email">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="artiste@verso.fr"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-950"
            >
              {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de récupération'}
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
