import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { AuthApiError } from '../../lib/auth-client.js';

export function RegisterPage(): React.ReactElement {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register({
        email,
        password,
        displayName: displayName.trim() || undefined,
      });
      navigate('/');
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError("Une erreur inattendue est survenue lors de l'inscription.");
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
          <h1 className="text-xl font-semibold text-slate-200">Créer un compte d'artiste</h1>
          <p className="text-sm text-slate-400">
            Écrivez en continu, organisez vos œuvres en toute intimité.
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
              Adresse email <span className="text-emerald-400">*</span>
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
            <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="displayName">
              Nom d'artiste / Pseudo <span className="text-slate-500">(optionnel)</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="MC Plume"
              maxLength={50}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="password">
              Mot de passe <span className="text-emerald-400">*</span>
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Min. 8 car. avec 1 majuscule, 1 minuscule, 1 chiffre et 1 symbole.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-950"
          >
            {isLoading ? 'Création du compte...' : 'Commencer à écrire'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
