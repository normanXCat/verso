import type { Extension } from '@codemirror/state';
import { RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';
import { analyzeRhymes, RHYME_PALETTE } from '@verso/shared';

const WORD_PATTERN = /[\p{L}]+(?:['’-][\p{L}]+)*/gu;

/** Convertit une couleur hexadécimale en `rgba` avec transparence. */
function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/**
 * Décore le dernier mot de chaque vers partageant une terminaison phonétique
 * avec une teinte distincte, pour visualiser les schémas de rimes (FR-032).
 */
function buildRhymeDecorations(view: EditorView): DecorationSet {
  const analysis = analyzeRhymes(view.state.doc.toString());
  const builder = new RangeSetBuilder<Decoration>();

  for (const info of analysis.lines) {
    if (info.colorIndex === null) {
      continue;
    }

    const docLine = view.state.doc.line(info.line + 1);
    const matches = [...docLine.text.matchAll(WORD_PATTERN)];
    const lastWord = matches[matches.length - 1];
    if (!lastWord) {
      continue;
    }

    const from = docLine.from + (lastWord.index ?? 0);
    const to = from + lastWord[0].length;
    const color = RHYME_PALETTE[info.colorIndex];

    builder.add(
      from,
      to,
      Decoration.mark({
        class: 'cm-rhyme-mark',
        attributes: {
          style: `background-color:${withAlpha(color, 0.16)};border-bottom:2px solid ${color};border-radius:2px;`,
        },
      }),
    );
  }

  return builder.finish();
}

/** Extension de surlignage dynamique des rimes. */
export function rhymeHighlighter(): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildRhymeDecorations(view);
      }

      update(update: ViewUpdate): void {
        if (update.docChanged) {
          this.decorations = buildRhymeDecorations(update.view);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    },
  );
}
