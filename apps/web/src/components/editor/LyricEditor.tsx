import React, { useEffect, useRef } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, placeholder as placeholderExtension } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syllablesGutter } from './extensions/syllablesGutter.js';
import { rhymeHighlighter } from './extensions/rhymeHighlighter.js';

interface LyricEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  readOnly?: boolean;
  /** Affiche la gouttière du décompte syllabique par vers. */
  showSyllables?: boolean;
  /** Active le surlignage coloré des rimes. */
  showRhymes?: boolean;
  /** Signale la sélection courante (mot sélectionné et ses positions). */
  onSelectionChange?: (selection: { text: string; from: number; to: number }) => void;
  className?: string;
}

const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: 'var(--color-text)',
    fontSize: '1rem',
  },
  '.cm-scroller': {
    fontFamily: "'Geist Sans', system-ui, sans-serif",
    lineHeight: '1.75rem',
    overflow: 'visible',
  },
  '.cm-content': {
    padding: '0.5rem 0',
    caretColor: 'var(--color-accent)',
  },
  '.cm-line': {
    padding: '0',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--color-accent)',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(217, 66, 28, 0.16)',
  },
  '.cm-placeholder': {
    color: 'var(--color-text-secondary)',
    fontStyle: 'italic',
  },
});

/**
 * Éditeur de paroles CodeMirror 6 sobre : sans numéros de ligne ni décorations
 * parasites, uniquement l'historique, les raccourcis essentiels et le retour à la ligne.
 */
export function LyricEditor({
  value,
  onChange,
  placeholder = '',
  ariaLabel = 'Éditeur de paroles',
  readOnly = false,
  showSyllables = true,
  showRhymes = true,
  onSelectionChange,
  className = '',
}: LyricEditorProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const extensions: Extension[] = [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.lineWrapping,
      editorTheme,
      EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
        if ((update.docChanged || update.selectionSet) && onSelectionChangeRef.current) {
          const range = update.state.selection.main;
          const text = update.state.sliceDoc(range.from, range.to);
          onSelectionChangeRef.current({ text, from: range.from, to: range.to });
        }
      }),
    ];

    if (placeholder) {
      extensions.push(placeholderExtension(placeholder));
    }

    if (showSyllables) {
      extensions.push(syllablesGutter());
    }

    if (showRhymes) {
      extensions.push(rhymeHighlighter());
    }

    const state = EditorState.create({ doc: initialValueRef.current, extensions });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [readOnly, ariaLabel, placeholder, showSyllables, showRhymes]);

  // Synchronise une valeur externe (restauration de brouillon) sans casser la frappe.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  return <div ref={containerRef} className={className} />;
}
