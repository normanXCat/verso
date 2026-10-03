import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { AuthApiError } from '../../lib/auth-client.js';

export function LoginPage(): React.ReactElement {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password, rememberMe });
      navigate('/');
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
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
          <h1 className="text-xl font-semibold text-slate-200">Connexion à votre espace</h1>
          <p className="text-sm text-slate-400">
            Retrouvez vos rimes, vos brouillons et vos projets.
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-300" htmlFor="password">
                Mot de passe
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>

          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <label htmlFor="rememberMe" className="ml-2 text-xs text-slate-400 cursor-pointer">
              Rester connecté sur cet appareil (30 jours)
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-950"
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
