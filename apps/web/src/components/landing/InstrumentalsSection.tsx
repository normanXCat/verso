import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Music, Repeat } from 'lucide-react';

const WAVEFORM_BARS = [
  24, 40, 65, 30, 85, 92, 45, 60, 78, 100, 80, 55, 35, 70, 90, 85, 40, 25, 60, 88, 95, 70, 50, 80,
  65, 30, 90, 85, 45, 60, 75, 40, 20, 55, 82, 94, 60, 30, 50, 75,
];

export function InstrumentalsSection(): React.ReactElement {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(88);
  const [playbackPos, setPlaybackPos] = useState<number>(14);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(
      () => {
        setPlaybackPos((prev) => (prev >= WAVEFORM_BARS.length - 1 ? 0 : prev + 1));
      },
      60000 / (bpm * 4),
    ); // Synchronisé au tempo !

    return () => clearInterval(interval);
  }, [isPlaying, bpm]);

  return (
    <section
      id="instrus"
      className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-paper-border/60"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Colonne gauche : Contexte éditorial */}
        <div className="lg:col-span-5 space-y-6">
          <span className="text-xs font-mono text-paper-muted uppercase tracking-wider block">
            03 — Le Studio Audio
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-paper-text tracking-tight">
            Écrire calé sur la grille, <br />
            <span className="italic">au millième de seconde.</span>
          </h2>
          <p className="text-paper-muted text-base leading-relaxed">
            Chargez votre production, délimitez une boucle de 16 mesures et calez votre écriture
            directement au tempo. Le rythme ne ment jamais.
          </p>

          <div className="space-y-4 pt-2 font-mono text-xs text-paper-muted">
            <div className="flex items-center gap-3 p-3 rounded border border-paper-border bg-paper-surface">
              <Repeat className="w-4 h-4 text-paper-accent shrink-0" />
              <span>Bouclage automatique des 16 mesures de couplet</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded border border-paper-border bg-paper-surface">
              <Music className="w-4 h-4 text-paper-accent shrink-0" />
              <span>Détection de tonalité pour orienter les mélodies et refrains</span>
            </div>
          </div>
        </div>

        {/* Colonne droite : Lecteur audio stylisé Encre & Papier */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-paper-border bg-paper-surface p-6 sm:p-8 shadow-paper-lg paper-grain">
            {/* Titre du morceau et métadonnées en Geist Mono */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-paper-border">
              <div>
                <span className="text-xs font-mono text-paper-muted uppercase tracking-wider">
                  Production audio active
                </span>
                <h3 className="font-serif text-2xl text-paper-text">Minuit Vingt-Deux (Beat 08)</h3>
              </div>

              {/* Indicateurs techniques en mono */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded border border-paper-border bg-paper-bg text-center">
                  <span className="text-[10px] uppercase font-mono text-paper-muted block">
                    Tempo
                  </span>
                  <span className="text-sm font-mono font-semibold text-paper-accent">
                    {bpm} BPM
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded border border-paper-border bg-paper-bg text-center">
                  <span className="text-[10px] uppercase font-mono text-paper-muted block">
                    Tonalité
                  </span>
                  <span className="text-sm font-mono font-semibold text-paper-text">Fa m / Fm</span>
                </div>
              </div>
            </div>

            {/* Forme d'onde animée interactive */}
            <div className="py-8">
              <div
                className="flex items-end justify-between gap-1 sm:gap-1.5 h-28 cursor-pointer select-none px-2"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  setPlaybackPos(Math.floor(ratio * WAVEFORM_BARS.length));
                }}
              >
                {WAVEFORM_BARS.map((height, idx) => {
                  const isCurrent = idx === playbackPos;
                  const isPast = idx < playbackPos;
                  const barHeight = isPlaying && isCurrent ? Math.min(100, height + 15) : height;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col justify-end items-center h-full group"
                    >
                      <div
                        className={`w-full rounded-xs transition-all duration-150 ${
                          isCurrent
                            ? 'bg-paper-accent shadow-sm scale-y-110'
                            : isPast
                              ? 'bg-paper-text/80'
                              : 'bg-paper-border hover:bg-paper-muted'
                        }`}
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Timecode en Geist Mono */}
              <div className="flex items-center justify-between text-xs font-mono text-paper-muted pt-4 px-2">
                <span>01:{String(Math.floor(playbackPos * 2.5)).padStart(2, '0')}</span>
                <span className="text-paper-accent font-medium">
                  {isLooping ? 'Boucle active [01 – 16]' : 'Lecture continue'}
                </span>
                <span>03:45</span>
              </div>
            </div>

            {/* Contrôles de lecture */}
            <div className="pt-6 border-t border-paper-border flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-paper-accent hover:bg-paper-accent/90 text-white flex items-center justify-center transition-transform active:scale-95 shadow-paper-sm"
                  aria-label={isPlaying ? 'Mettre en pause' : 'Lancer la lecture'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPlaybackPos(0)}
                  className="p-2.5 rounded-lg border border-paper-border text-paper-muted hover:text-paper-text hover:bg-paper-bg transition-colors"
                  title="Revenir au début"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    isLooping
                      ? 'border-paper-accent text-paper-accent bg-paper-accent/10'
                      : 'border-paper-border text-paper-muted hover:text-paper-text'
                  }`}
                  title="Basculer la boucle"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>

              {/* Ajustement interactif de tempo BPM */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-paper-muted">Ajuster tempo :</span>
                <div className="flex items-center border border-paper-border rounded bg-paper-bg">
                  <button
                    type="button"
                    onClick={() => setBpm((prev) => Math.max(60, prev - 1))}
                    className="px-2.5 py-1 text-paper-muted hover:text-paper-text transition-colors"
                  >
                    -
                  </button>
                  <span className="px-2 font-semibold text-paper-text">{bpm}</span>
                  <button
                    type="button"
                    onClick={() => setBpm((prev) => Math.min(180, prev + 1))}
                    className="px-2.5 py-1 text-paper-muted hover:text-paper-text transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
