import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Feather } from 'lucide-react';
import { shareClient, ShareApiError } from '../lib/share-client.js';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'full',
  timeStyle: 'short',
});

function formatTimestamp(value: Date | string): string {
  return dateFormatter.format(value instanceof Date ? value : new Date(value));
}

/**
 * Page de consultation anonyme d'un texte partagé : strictement en lecture seule,
 * sans aucune option de modification ni donnée personnelle de l'auteur (FR-041, FR-044).
 */
export function PublicSharePage(): React.ReactElement {
  const { token = '' } = useParams<{ token: string }>();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-share', token],
    queryFn: () => shareClient.getPublic(token),
    enabled: token.length > 0,
    retry: false,
  });

  const isInactive = error instanceof ShareApiError && error.statusCode === 404;

  return (
    <div className="paper-grain min-h-screen bg-paper-bg text-paper-text">
      <header className="border-b border-paper-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 md:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-serif text-lg text-paper-text"
          >
            <Feather className="h-4 w-4 text-paper-accent" aria-hidden="true" />
            Verso
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-wide text-paper-muted">
            Lecture seule
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 md:px-10">
        {isLoading ? (
          <div
            className="h-64 animate-pulse rounded-card border border-paper-border bg-paper-surface/60"
            aria-busy="true"
          />
        ) : isError || !data ? (
          <div className="rounded-card border border-paper-border bg-paper-surface p-8 text-center">
            <h1 className="font-serif text-2xl text-paper-text">Ce lien n'est plus actif</h1>
            <p className="mt-2 text-sm text-paper-muted">
              {isInactive
                ? 'Il a peut-être été révoqué ou a expiré.'
                : 'Impossible de charger ce texte pour le moment.'}
            </p>
          </div>
        ) : (
          <article className="rounded-card border border-paper-border bg-paper-surface p-8 shadow-paper-sm md:p-10">
            <h1 className="font-serif text-3xl text-paper-text md:text-4xl">
              {data.title || 'Sans titre'}
            </h1>
            <p className="mt-3 text-xs font-mono text-paper-muted">
              par {data.authorDisplayName} · dernière révision le {formatTimestamp(data.updatedAt)}
            </p>

            <div className="notebook-ruled mt-8 rounded-card border border-paper-border bg-paper-bg p-6">
              <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-paper-text">
                {data.content.trim() || '(texte vide)'}
              </pre>
            </div>
          </article>
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-6 pb-12 md:px-10">
        <p className="text-center text-[11px] font-mono text-paper-muted">
          Partagé en lecture seule via Verso — aucune modification possible.
        </p>
      </footer>
    </div>
  );
}

export default PublicSharePage;
