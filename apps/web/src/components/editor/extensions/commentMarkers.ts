import type { Extension } from '@codemirror/state';
import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, gutter } from '@codemirror/view';

export interface CommentAnchor {
  id: string;
  startLine: number;
  endLine: number;
  isResolved: boolean;
}

/** Effet permettant de mettre à jour la liste des ancres de commentaires */
export const setCommentAnchorsEffect = StateEffect.define<CommentAnchor[]>();

class CommentGutterMarker extends GutterMarker {
  constructor(
    private readonly commentId: string,
    private readonly onSelect?: (commentId: string) => void,
  ) {
    super();
  }

  override toDOM(): HTMLElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cm-comment-gutter-btn';
    btn.title = 'Voir la discussion';
    btn.innerHTML = `
      <svg class="w-3.5 h-3.5 text-primary-400 hover:text-primary-300" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-5 0h-2v2h2V9z" clip-rule="evenodd" />
      </svg>
    `;
    if (this.onSelect) {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.onSelect?.(this.commentId);
      };
    }
    return btn;
  }
}

const commentsField = StateField.define<CommentAnchor[]>({
  create() {
    return [];
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setCommentAnchorsEffect)) {
        return effect.value;
      }
    }
    return value;
  },
});

const commentsGutterTheme = EditorView.baseTheme({
  '.cm-comments-gutter': {
    width: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  '.cm-comment-gutter-btn': {
    background: 'transparent',
    border: 'none',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: '0.85',
    transition: 'opacity 0.15s, transform 0.15s',
  },
  '.cm-comment-gutter-btn:hover': {
    opacity: '1',
    transform: 'scale(1.15)',
  },
  '.cm-comment-line-highlight': {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderLeft: '2px solid rgba(99, 102, 241, 0.5)',
  },
});

/**
 * Extension CodeMirror 6 affichant une gouttière de marqueurs de commentaires et
 * le surlignage des vers commentés
 */
export function commentMarkers(options?: {
  onSelectComment?: (commentId: string) => void;
}): Extension {
  const lineHighlightPlugin = EditorView.decorations.compute([commentsField], (state) => {
    const anchors = state.field(commentsField, false) || [];
    const openAnchors = anchors.filter((a) => !a.isResolved);
    const builder = new RangeSetBuilder<Decoration>();

    const docLines = state.doc.lines;

    // Regrouper les lignes concernées
    const highlightedLineNums = new Set<number>();
    for (const a of openAnchors) {
      for (let l = a.startLine; l <= a.endLine; l++) {
        if (l >= 1 && l <= docLines) {
          highlightedLineNums.add(l);
        }
      }
    }

    const sortedLines = [...highlightedLineNums].sort((a, b) => a - b);
    for (const lineNum of sortedLines) {
      const line = state.doc.line(lineNum);
      builder.add(line.from, line.from, Decoration.line({ class: 'cm-comment-line-highlight' }));
    }

    return builder.finish();
  });

  const gutterExtension = gutter({
    class: 'cm-comments-gutter',
    lineMarker(view, line) {
      const anchors = view.state.field(commentsField, false) || [];
      const lineNum = view.state.doc.lineAt(line.from).number;
      const matched = anchors.find((a) => !a.isResolved && a.startLine === lineNum);

      if (matched) {
        return new CommentGutterMarker(matched.id, options?.onSelectComment);
      }
      return null;
    },
    lineMarkerChange: (update) =>
      update.docChanged ||
      update.viewportChanged ||
      update.transactions.some((tr) => tr.effects.some((e) => e.is(setCommentAnchorsEffect))),
  });

  return [commentsField, lineHighlightPlugin, gutterExtension, commentsGutterTheme];
}
