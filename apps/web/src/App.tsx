import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <header className="text-center space-y-4 max-w-xl">
        <h1 className="text-5xl font-extrabold tracking-tight font-mono">VERSO</h1>
        <p className="text-lg text-slate-400">
          Espace d'écriture minimaliste pour rappeurs. Écrire, organiser, protéger.
        </p>
        <div className="pt-6 flex justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
          >
            Connexion
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 font-medium transition-colors"
          >
            Créer un compte
          </Link>
        </div>
      </header>
    </div>
  );
}

export function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <h2 className="text-2xl font-bold">Connexion Verso</h2>
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <h2 className="text-2xl font-bold">Inscription Verso</h2>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
