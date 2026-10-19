import { Headphones, Pause, Play, Radio, RotateCcw, Zap } from 'lucide-react';
import type { UseStudioSessionResult } from '../../lib/useStudioSession.js';
import type { UseAudioPlayerResult } from '../../hooks/useAudioPlayer.js';

interface SessionBarProps {
  session: UseStudioSessionResult;
  player: UseAudioPlayerResult;
  hasTrack: boolean;
  className?: string;
}

export function SessionBar({
  session,
  player,
  hasTrack,
  className = '',
}: SessionBarProps): React.ReactElement {
  const {
    isStudioActive,
    toggleStudioMode,
    metronomeEnabled,
    bpm,
    syncPlay,
    syncPause,
    syncSeek,
    syncMetronome,
    setBpm,
  } = session;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-lg border transition-all ${
        isStudioActive
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          : 'bg-neutral-800/40 border-neutral-700/40 text-neutral-400'
      } ${className}`}
    >
      {/* Bouton d'activation du Mode Session Studio */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleStudioMode}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
            isStudioActive
              ? 'bg-amber-500 text-neutral-950 shadow-sm hover:bg-amber-400'
              : 'bg-neutral-700/60 text-neutral-300 hover:bg-neutral-700'
          }`}
          title={
            isStudioActive
              ? 'Désactiver la synchronisation studio'
              : 'Synchroniser la lecture audio et le métronome avec les co-auteurs'
          }
        >
          {isStudioActive ? (
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          ) : (
            <Headphones className="w-3.5 h-3.5" />
          )}
          <span>{isStudioActive ? 'Session Studio en direct' : 'Mode Studio'}</span>
        </button>

        {isStudioActive && (
          <span className="hidden sm:inline-block text-[11px] text-amber-300/80">
            Audio & métronome synchronisés
          </span>
        )}
      </div>

      {/* Contrôles synchronisés si la session est active */}
      {isStudioActive && (
        <div className="flex items-center gap-3">
          {/* Transport audio partagé */}
          {hasTrack && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => syncSeek(Math.max(0, player.currentTime - 5))}
                className="p-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-700/50"
                title="Reculer de 5s pour tous"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => (player.isPlaying ? syncPause() : syncPlay())}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-neutral-950 hover:bg-amber-400"
                title={
                  player.isPlaying ? 'Mettre en pause pour tous' : 'Lancer la lecture pour tous'
                }
              >
                {player.isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>
            </div>
          )}

          {/* Métronome partagé */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-700/60">
            <button
              type="button"
              onClick={() => syncMetronome(!metronomeEnabled)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                metronomeEnabled
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Activer/désactiver le métronome synchronisé"
            >
              <Zap
                className={`w-3 h-3 ${metronomeEnabled ? 'text-amber-400 animate-bounce' : ''}`}
              />
              <span>Métronome</span>
            </button>

            {/* Ajustement BPM */}
            <div className="flex items-center gap-1 text-xs text-neutral-300">
              <button
                type="button"
                onClick={() => setBpm(Math.max(30, bpm - 2))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-700/50"
              >
                -
              </button>
              <span className="font-mono text-xs w-8 text-center">{bpm}</span>
              <button
                type="button"
                onClick={() => setBpm(Math.min(260, bpm + 2))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-700/50"
              >
                +
              </button>
              <span className="text-[10px] text-neutral-500">BPM</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
