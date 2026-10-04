import type { Extension } from '@codemirror/state';
import { EditorView, GutterMarker, gutter } from '@codemirror/view';
import { countLineSyllables } from '@verso/shared';

/** Marqueur de marge affichant le nombre de syllabes d'un vers. */
class SyllableMarker extends GutterMarker {
  constructor(private readonly label: string) {
    super();
  }

  override toDOM(): HTMLElement {
    const element = document.createElement('span');
    element.className = 'cm-syllable-count';
    element.textContent = this.label;
    element.setAttribute('aria-hidden', 'true');
    return element;
  }
}

const gutterTheme = EditorView.baseTheme({
  '.cm-syllables-gutter': {
    minWidth: '2rem',
    paddingRight: '0.5rem',
    textAlign: 'right',
    color: 'var(--color-text-secondary)',
    fontFamily: "'Geist Mono', ui-monospace, monospace",
    fontSize: '0.6875rem',
    opacity: '0.7',
  },
  '.cm-syllables-gutter .cm-gutterElement': {
    lineHeight: 'inherit',
  },
});

/**
 * Gouttière de marge affichant le décompte syllabique de chaque vers, recalculé
 * à chaque modification du document (FR-031).
 */
export function syllablesGutter(): Extension {
  return [
    gutter({
      class: 'cm-syllables-gutter',
      lineMarker(view, line) {
        const count = countLineSyllables(view.state.doc.lineAt(line.from).text);
        return count > 0 ? new SyllableMarker(String(count)) : null;
      },
      lineMarkerChange: (update) => update.docChanged || update.viewportChanged,
      initialSpacer: () => new SyllableMarker('00'),
    }),
    gutterTheme,
  ];
}
