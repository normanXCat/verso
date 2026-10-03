import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SessionInfo } from '@verso/shared';
import { authClient, AuthApiError } from '../../lib/auth-client.js';

export function SessionsPage(): React.ReactElement {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const data = await authClient.getSessions();
      setSessions(data);
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError('Impossible de charger les sessions.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeOne = async (id: string) => {
    setError(null);
    setActionSuccess(null);
    try {
      const res = await authClient.revokeSession(id);
      setActionSuccess(res.message);
      await fetchSessions();
    } catch {
      setError('Impossible de révoquer cette session.');
    }
  };

  const handleRevokeAllExceptCurrent = async () => {
    setError(null);
    setActionSuccess(null);
    try {
      const res = await authClient.revokeAllSessions(true);
      setActionSuccess(res.message);
      await fetchSessions();
    } catch {
      setError('Impossible de révoquer les autres sessions.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <Link to="/" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
              ← Retour à l'espace d'écriture
            </Link>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">
              Sessions et Appareils connectés
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Consultez et révoquez les appareils ayant accès à votre compte Verso.
            </p>
          </div>

          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <button
              onClick={handleRevokeAllExceptCurrent}
              className="py-2 px-3.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium transition-colors"
            >
              Déconnecter tous les autres appareils
            </button>
          )}
        </div>

        {actionSuccess && (
          <div className="p-3 text-sm rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300">
            {actionSuccess}
          </div>
        )}

        {error && (
          <div className="p-3 text-sm rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">Chargement des sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Aucune session active trouvée.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-200">
                      {session.userAgent || 'Appareil inconnu'}
                    </span>
                    {session.isCurrent && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400">
                        Session actuelle
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap gap-x-4">
                    <span>IP : {session.ipAddress || 'Non communiquée'}</span>
                    <span>
                      Dernière activité : {new Date(session.lastActiveAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevokeOne(session.id)}
                    className="py-1.5 px-3 rounded-lg border border-slate-700 hover:border-rose-700 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-medium transition-colors"
                  >
                    Révoquer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
