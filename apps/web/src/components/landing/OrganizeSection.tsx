import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Disc, Layers } from 'lucide-react';
import { Tag } from '../ui/Tag.js';

interface TrackItem {
  id: string;
  num: string;
  title: string;
  bpm: number;
  key: string;
  status: 'Terminé' | 'Mix en cours' | 'Brouillon';
  measures: number;
}

const INITIAL_TRACKS: TrackItem[] = [
  {
    id: 't1',
    num: '01',
    title: 'Intro (Sous le néon)',
    bpm: 88,
    key: 'Fa mineur',
    status: 'Terminé',
    measures: 16,
  },
  {
    id: 't2',
    num: '02',
    title: 'Temps Morts & Poussière',
    bpm: 92,
    key: 'Do dièse',
    status: 'Mix en cours',
    measures: 32,
  },
  {
    id: 't3',
    num: '03',
    title: 'L’Encre & le Fer',
    bpm: 86,
    key: 'Sol mineur',
    status: 'Terminé',
    measures: 48,
  },
  {
    id: 't4',
    num: '04',
    title: 'Intermède Nocturne',
    bpm: 78,
    key: 'Mi bémol',
    status: 'Brouillon',
    measures: 12,
  },
];

export function OrganizeSection(): React.ReactElement {
  const [tracks, setTracks] = useState<TrackItem[]>(INITIAL_TRACKS);
  const [selectedAlbum, setSelectedAlbum] = useState<number>(0);
  const [stackHovered, setStackHovered] = useState<boolean>(false);

  const albums = [
    { title: 'Miroir Fumé', year: '2026', count: 12, genre: 'Album Studio' },
    { title: 'Noctambule EP', year: '2025', count: 6, genre: 'EP 6 Titres' },
    { title: 'Carnet d’Archives', year: '2024', count: 24, genre: 'Brouillons' },
  ];

  const moveTrack = (index: number, direction: 'up' | 'down'): void => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tracks.length) return;

    const newTracks = [...tracks];
    const item = newTracks[index];
    newTracks.splice(index, 1);
    newTracks.splice(targetIndex, 0, item);
    setTracks(newTracks);
  };

  return (
    <section
      id="organiser"
      className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-paper-border/60"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Colonne gauche : Pile d'albums et explication */}
        <div className="lg:col-span-5 space-y-6">
          <span className="text-xs font-mono text-paper-muted uppercase tracking-wider block">
            02 — L'Architecture des Projets
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-paper-text tracking-tight">
            Des couplets isolés à <br />
            <span className="italic">l'album complet.</span>
          </h2>
          <p className="text-paper-muted text-base leading-relaxed">
            Conservez l'intégrité de vos idées. Classez vos écrits en projets, albums et disques.
            Survolez la pile pour voir les disques se déployer.
          </p>

          {/* Démonstration de pile d'albums déployable */}
          <div
            className="pt-6 relative min-h-[220px] cursor-pointer"
            onMouseEnter={() => setStackHovered(true)}
            onMouseLeave={() => setStackHovered(false)}
          >
            {albums.map((album, idx) => {
              const offset = idx * 16;
              const rotation = stackHovered ? (idx - 1) * 4 : idx * 1.5;
              const translateY = stackHovered ? idx * 28 : offset;

              return (
                <motion.div
                  key={album.title}
                  animate={{
                    y: translateY,
                    rotate: rotation,
                    scale: selectedAlbum === idx ? 1.02 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  onClick={() => setSelectedAlbum(idx)}
                  className={`absolute left-0 right-0 p-5 rounded-lg border bg-paper-surface shadow-paper-md transition-colors ${
                    selectedAlbum === idx
                      ? 'border-paper-accent'
                      : 'border-paper-border hover:border-paper-muted'
                  }`}
                  style={{ top: 0, zIndex: 10 - idx }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded bg-paper-bg flex items-center justify-center border border-paper-border text-paper-accent">
                        <Disc className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-lg text-paper-text">{album.title}</h4>
                        <p className="text-xs font-mono text-paper-muted">
                          {album.genre} • {album.year}
                        </p>
                      </div>
                    </div>
                    <Tag mono variant="neutral">
                      {album.count} titres
                    </Tag>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="text-xs font-mono text-paper-muted pt-28 italic">
            * Survolez la pile pour déployer la discographie
          </p>
        </div>

        {/* Colonne droite : Tracklist interactive réordonnable */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-paper-border bg-paper-surface p-6 sm:p-8 shadow-paper-lg paper-grain">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-paper-border">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-paper-accent" />
                <h3 className="font-serif text-xl text-paper-text">
                  Tracklist : {albums[selectedAlbum].title}
                </h3>
              </div>
              <span className="text-xs font-mono text-paper-muted">
                {tracks.length} morceaux en préparation
              </span>
            </div>

            {/* Liste animée des morceaux avec boutons de réordonnancement */}
            <div className="space-y-3">
              <AnimatePresence>
                {tracks.map((track, idx) => (
                  <motion.div
                    key={track.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between gap-4 p-3.5 rounded-lg border border-paper-border bg-paper-bg hover:border-paper-accent/50 transition-colors group"
                  >
                    {/* Numéro et titre */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-paper-muted w-6 text-center shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="truncate">
                        <span className="font-medium text-sm text-paper-text block truncate">
                          {track.title}
                        </span>
                        <div className="flex items-center gap-2 text-xs font-mono text-paper-muted">
                          <span>{track.bpm} BPM</span>
                          <span>•</span>
                          <span>{track.key}</span>
                          <span>•</span>
                          <span>{track.measures} mesures</span>
                        </div>
                      </div>
                    </div>

                    {/* Statut et boutons de déplacement */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Tag
                        variant={
                          track.status === 'Terminé'
                            ? 'accent'
                            : track.status === 'Mix en cours'
                              ? 'neutral'
                              : 'draft'
                        }
                        mono
                      >
                        {track.status}
                      </Tag>

                      <div className="flex items-center border border-paper-border rounded bg-paper-surface">
                        <button
                          type="button"
                          onClick={() => moveTrack(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-paper-muted hover:text-paper-text disabled:opacity-30 disabled:hover:text-paper-muted transition-colors"
                          title="Déplacer vers le haut"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTrack(idx, 'down')}
                          disabled={idx === tracks.length - 1}
                          className="p-1 text-paper-muted hover:text-paper-text disabled:opacity-30 disabled:hover:text-paper-muted border-l border-paper-border transition-colors"
                          title="Déplacer vers le bas"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-6 pt-4 border-t border-paper-border/60 flex items-center justify-between text-xs font-mono text-paper-muted">
              <span>Testez la réorganisation avec les flèches ↑ ↓</span>
              <span className="text-paper-accent">Ordre narratif conservé</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
