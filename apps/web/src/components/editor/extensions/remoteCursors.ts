import type { Extension } from '@codemirror/state';
import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';

export interface RemoteCursorData {
  userId: string;
  displayName: string;
  color: string;
  from: number;
  to: number;
}

export const setRemoteCursorsEffect = StateEffect.define<RemoteCursorData[]>();

class RemoteCursorWidget extends WidgetType {
  constructor(
    private readonly name: string,
    private readonly color: string,
  ) {
    super();
  }

  override toDOM(): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-remote-cursor-caret';
    wrap.style.borderLeft = `2px solid ${this.color}`;
    wrap.style.marginLeft = '-1px';
    wrap.style.marginRight = '-1px';
    wrap.style.position = 'relative';
    wrap.style.display = 'inline-block';
    wrap.style.height = '1.2em';
    wrap.style.verticalAlign = 'text-bottom';
    wrap.style.pointerEvents = 'none';

    const label = document.createElement('span');
    label.className = 'cm-remote-cursor-label';
    label.textContent = this.name;
    label.style.backgroundColor = this.color;
    label.style.color = '#ffffff';
    label.style.fontSize = '0.6875rem';
    label.style.fontWeight = '500';
    label.style.padding = '1px 5px';
    label.style.borderRadius = '3px';
    label.style.position = 'absolute';
    label.style.top = '-1.35em';
    label.style.left = '-2px';
    label.style.whiteSpace = 'nowrap';
    label.style.pointerEvents = 'none';
    label.style.zIndex = '20';
    label.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';

    wrap.appendChild(label);
    return wrap;
  }

  override eq(other: RemoteCursorWidget): boolean {
    return other.name === this.name && other.color === this.color;
  }
}

const remoteCursorsField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setRemoteCursorsEffect)) {
        const builder = new RangeSetBuilder<Decoration>();
        const cursors = [...effect.value].sort((a, b) => a.from - b.from);
        const docLen = tr.newDoc.length;

        for (const c of cursors) {
          const from = Math.min(Math.max(0, c.from), docLen);
          const to = Math.min(Math.max(0, c.to), docLen);

          if (from < to) {
            builder.add(
              from,
              to,
              Decoration.mark({
                attributes: {
                  style: `background-color: ${c.color}26; border-bottom: 1px solid ${c.color}80;`,
                },
              }),
            );
          }

          builder.add(
            to,
            to,
            Decoration.widget({
              widget: new RemoteCursorWidget(c.displayName, c.color),
              side: 1,
            }),
          );
        }

        return builder.finish();
      }
    }

    return decorations.map(tr.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

const remoteCursorsTheme = EditorView.baseTheme({
  '.cm-remote-cursor-caret': {
    animation: 'fadeRemoteCaret 1.5s infinite alternate ease-in-out',
  },
  '@keyframes fadeRemoteCaret': {
    '0%': { opacity: '1' },
    '100%': { opacity: '0.8' },
  },
});

export function remoteCursors(): Extension {
  return [remoteCursorsField, remoteCursorsTheme];
}
