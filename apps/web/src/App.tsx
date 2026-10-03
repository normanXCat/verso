import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.js';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage.js';
import { SessionsPage } from './pages/auth/SessionsPage.js';

const queryClient = new QueryClient();

function HomePage(): React.ReactElement {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-slate-950 text-slate-100">
      <header className="text-center space-y-4 max-w-xl">
        <h1 className="text-5xl font-extrabold tracking-tight font-mono text-emerald-400">VERSO</h1>
        <p className="text-lg text-slate-400">
          Espace d'écriture minimaliste pour rappeurs. Écrire, organiser, protéger.
        </p>

        {isAuthenticated && user ? (
          <div className="pt-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm">
              <p className="text-slate-300">
                Connecté en tant que{' '}
                <span className="font-semibold text-emerald-400">
                  {user.displayName || user.email}
                </span>{' '}
                ({user.email})
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Link
                to="/sessions"
                className="px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 text-sm font-medium transition-colors"
              >
                Appareils & Sessions
              </Link>
              <button
                onClick={() => logout()}
                className="px-5 py-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-sm font-medium transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-6 flex justify-center gap-4">
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-lg shadow-emerald-950 text-sm"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="px-6 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 font-medium transition-colors text-sm"
            >
              Créer un compte
            </Link>
          </div>
        )}
      </header>
    </div>
  );
}

export function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
