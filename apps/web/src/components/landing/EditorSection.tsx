import React, { useState, useId } from 'react';
import { Check, RotateCcw } from 'lucide-react';

/**
 * Calculateur heuristique précis de syllabes poétiques françaises
 */
function countSyllablesFrench(line: string): number {
  const trimmed = line.trim();
  if (!trimmed) return 0;

  // Nettoyage de la ponctuation
  const words = trimmed
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"«»]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  let total = 0;

  for (const word of words) {
    // Voyelles accentuées et voyelles standards
    const vowelClusters = word.match(/[aeiouyàâäéèêëîïôöùûü]+/gi);
    if (!vowelClusters) {
      total += 1;
      continue;
    }

    let count = vowelClusters.length;

    // Règle du 'e' muet final en français parlé/rap
    if (word.endsWith('e') && !word.endsWith('ée') && count > 1) {
      count -= 1;
    }

    total += Math.max(1, count);
  }

  return total;
}

const DEFAULT_TEXT = `J'écris sur la table où la nuit s'évapore,
Le chrono s'arrête quand la basse résonne encore.
Chaque mesure est pesée au milligramme près,
Pas de rime en plastique, que du grain authentique.`;

export function EditorSection(): React.ReactElement {
  const [content, setContent] = useState(DEFAULT_TEXT);
  const [lastSaved, setLastSaved] = useState('17:34');
  const [isTyping, setIsTyping] = useState(false);
  const editorInputId = useId();

  const lines = content.split('\n');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setContent(e.target.value);
    setIsTyping(true);

    const now = new Date();
    const formatted = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;

    setTimeout(() => {
      setLastSaved(formatted);
      setIsTyping(false);
    }, 400);
  };

  const handleReset = (): void => {
    setContent(DEFAULT_TEXT);
  };

  return (
    <section
      id="ecrire"
      className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-paper-border/60"
    >
      {/* En-tête de section éditoriale */}
      <div className="max-w-2xl mb-12">
        <span className="text-xs font-mono text-paper-muted uppercase tracking-wider block mb-3">
          01 — L'Atelier d'écriture
        </span>
        <h2 className="text-4xl md:text-5xl font-serif text-paper-text tracking-tight mb-4">
          Laisser couler le flow, <br className="hidden sm:inline" />
          <span className="italic">mesurer chaque silence.</span>
        </h2>
        <p className="text-paper-muted text-base leading-relaxed">
          Un espace de saisie sans distraction. Tapez directement dans le mockup ci-dessous pour
          observer le calcul syllabique instantané ligne par ligne.
        </p>
      </div>

      {/* Mockup interactif d'éditeur */}
      <div className="rounded-xl border border-paper-border bg-paper-surface shadow-paper-lg overflow-hidden paper-grain">
        {/* Barre d'outils supérieure de l'éditeur */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-paper-border bg-paper-bg/50">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-paper-accent" />
            <span className="font-serif text-lg text-paper-text font-normal">
              Morceau sans titre — Couplet 1
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded border border-paper-border bg-paper-surface text-paper-muted">
              Brouillon
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-paper-muted">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  isTyping ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span className="text-paper-text">
                {isTyping ? 'Écriture...' : `Enregistré à ${lastSaved}`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 hover:text-paper-accent transition-colors px-2 py-1 rounded hover:bg-paper-border/30"
              title="Réinitialiser l'exemple"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>

        {/* Zone d'écriture interactive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[320px]">
          {/* Colonne gauche : Éditeur réel avec synchronisation des métriques */}
          <div className="lg:col-span-8 p-6 sm:p-8 notebook-margin pl-6 sm:pl-10 relative">
            <label htmlFor={editorInputId} className="sr-only">
              Zone d'écriture de rap interactive
            </label>
            <textarea
              id={editorInputId}
              value={content}
              onChange={handleTextChange}
              rows={Math.max(6, lines.length)}
              placeholder="Écrivez votre couplet ici..."
              className="w-full bg-transparent resize-none border-none outline-none font-mono text-sm sm:text-base text-paper-text leading-[28px] focus:ring-0 p-0"
              spellCheck={false}
            />
          </div>

          {/* Colonne droite : Gouttière des compteurs de syllabes en direct */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-paper-border bg-paper-bg/30 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-paper-border/60 text-xs font-mono text-paper-muted">
                <span>Ligne</span>
                <span>Décompte Syllabes</span>
              </div>

              <div className="space-y-2 font-mono text-sm">
                {lines.map((line, idx) => {
                  const syl = countSyllablesFrench(line);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 px-2 rounded bg-paper-surface/60 border border-paper-border/40"
                    >
                      <span className="text-xs text-paper-muted">
                        Mesure {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            syl > 0 ? 'text-paper-accent' : 'text-paper-muted'
                          }`}
                        >
                          {syl}
                        </span>
                        <span className="text-[10px] text-paper-muted uppercase">syl</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-paper-border/60 text-xs font-mono text-paper-muted space-y-2">
              <div className="flex items-center justify-between">
                <span>Total mesures</span>
                <span className="font-semibold text-paper-text">{lines.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Régularité métrique</span>
                <span className="text-paper-accent font-semibold">12 à 14 syllabes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pied d'éditeur : Cadence et statut de synchronisation */}
        <div className="px-6 py-3 border-t border-paper-border bg-paper-bg/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-paper-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-paper-text">
              <Check className="w-3.5 h-3.5 text-paper-accent" />
              Sauvegarde continue sans délai
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Supporte l'écriture hors-ligne</span>
          </div>
          <span className="italic">Zéro latence sur la frappe</span>
        </div>
      </div>
    </section>
  );
}
