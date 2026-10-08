import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, FileText, Disc3, Shield } from 'lucide-react';
import type { CollaboratorRole } from '@verso/shared';
import { collaborationClient, type SharedWithMeItem } from '../lib/collaboration-client.js';
import { SharedBadge } from '../components/collaboration/SharedBadge.js';
import { ThemeToggle } from '../components/common/ThemeToggle.js';

export function SharedWithMePage(): React.ReactElement {
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'song' | 'album'>('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['collaborations', 'shared-with-me', selectedRole, selectedType],
    queryFn: () =>
      collaborationClient.getSharedWithMe({
        role: selectedRole === 'all' ? undefined : selectedRole,
        type: selectedType,
      }),
  });

  const items = data?.items || [];

  return (
    <div className="paper-grain min-h-screen bg-paper-bg text-paper-text">
      {/* En-tête */}
      <header className="sticky top-0 z-30 border-b border-paper-border bg-paper-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3 md:px-10">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-paper-muted transition-colors hover:text-paper-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Mon carnet
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/invitations"
              className="text-xs font-mono text-paper-muted transition-colors hover:text-paper-text"
            >
              Invitations reçues
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 md:px-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center text-accent">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-paper-text">
                Partagés avec moi
              </h1>
              <p className="text-xs font-mono text-paper-muted">
                Œuvres écrites ou relues en collaboration avec d'autres artistes
              </p>
            </div>
          </div>
        </div>

        {/* Barre de filtres */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-paper-border pb-4">
          {/* Filtre par type */}
          <div className="flex items-center gap-1 rounded-lg bg-surface-card p-1 border border-border">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedType === 'all'
                  ? 'bg-accent/15 text-accent shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Tout
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('song')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedType === 'song'
                  ? 'bg-accent/15 text-accent shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Textes
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('album')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedType === 'album'
                  ? 'bg-accent/15 text-accent shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Albums
            </button>
          </div>

          {/* Filtre par rôle */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Shield className="h-3.5 w-3.5" />
            <span>Rôle :</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as CollaboratorRole | 'all')}
              className="bg-surface-card border border-border rounded-md px-2 py-1 text-xs text-text-primary focus:outline-hidden focus:border-accent"
            >
              <option value="all">Tous les rôles</option>
              <option value="CO_AUTHOR">Co-auteur</option>
              <option value="COMMENTER">Commentateur</option>
              <option value="READER">Lecteur</option>
            </select>
          </div>
        </div>

        {/* Contenu */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-36 animate-pulse rounded-card border border-paper-border bg-paper-surface/60"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-card border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-400">
            Impossible de charger les œuvres partagées pour le moment.
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-paper-border bg-paper-surface/50 px-6 py-16 text-center">
            <Users className="mb-4 h-8 w-8 text-paper-muted" aria-hidden="true" />
            <p className="font-serif text-xl text-paper-text">Aucune œuvre partagée</p>
            <p className="mt-1 text-xs text-paper-muted max-w-sm">
              Lorsqu'un artiste vous invite à collaborer sur ses paroles ou ses albums, ils
              apparaîtront directement ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item: SharedWithMeItem) => (
              <Link
                key={`${item.type}-${item.id}`}
                to={item.type === 'song' ? `/songs/${item.id}` : `/albums/${item.id}`}
                className="group flex flex-col justify-between rounded-card border border-paper-border bg-paper-surface/70 p-5 transition-all hover:border-paper-accent/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-mono text-paper-muted">
                      {item.type === 'song' ? (
                        <>
                          <FileText className="h-3.5 w-3.5" /> Texte
                        </>
                      ) : (
                        <>
                          <Disc3 className="h-3.5 w-3.5" /> Album ({item.trackCount} pistes)
                        </>
                      )}
                    </span>
                    <SharedBadge role={item.role} ownerName={item.owner.displayName || 'Artiste'} />
                  </div>

                  <h3 className="font-serif text-lg font-bold text-paper-text group-hover:text-paper-accent transition-colors truncate">
                    {item.title}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-paper-border/60 flex items-center justify-between text-[11px] font-mono text-paper-muted">
                  <span>Modifié le {new Date(item.updatedAt).toLocaleDateString('fr-FR')}</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Ouvrir →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default SharedWithMePage;
