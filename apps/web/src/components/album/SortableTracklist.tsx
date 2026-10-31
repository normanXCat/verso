import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { cleanExcerpt, type AlbumTrack } from '@verso/shared';
import { Tag } from '../ui/Tag.js';

interface SortableRowProps {
  track: AlbumTrack;
  index: number;
  onRemove: (songId: string) => void;
  disabled: boolean;
}

function SortableRow({ track, index, onRemove, disabled }: SortableRowProps): React.ReactElement {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const handleRowClick = (event: React.MouseEvent<HTMLLIElement>): void => {
    if ((event.target as HTMLElement).closest('button, [role="button"]')) {
      return;
    }
    if ((event.target as HTMLElement).closest('a')) {
      return;
    }
    navigate(`/app/songs/${track.id}`);
  };

  const excerptText = cleanExcerpt(track.excerpt);

  return (
    <li
      ref={setNodeRef}
      style={style}
      onClick={handleRowClick}
      className={`group relative flex items-center gap-3 rounded-paper border px-3 py-2.5 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-paper-accent focus-within:ring-offset-2 focus-within:ring-offset-paper-bg ${
        isDragging
          ? 'border-paper-accent bg-paper-accent/5 shadow-paper-md'
          : 'border-paper-border bg-paper-surface hover:border-paper-muted hover:shadow-paper-sm'
      }`}
    >
      <button
        type="button"
        className="relative z-10 cursor-grab touch-none rounded p-1 text-paper-muted transition-colors hover:text-paper-accent active:cursor-grabbing disabled:opacity-40"
        aria-label={`Réordonner « ${track.title} »`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      <span className="pointer-events-none w-6 shrink-0 text-right font-mono text-xs text-paper-muted">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-lg leading-tight text-paper-text group-hover:text-paper-accent transition-colors">
          <Link
            to={`/app/songs/${track.id}`}
            className="rounded-xs focus:outline-none after:block after:absolute after:inset-0 after:z-0 after:cursor-pointer after:content-['']"
          >
            {track.title}
          </Link>
        </p>
        {excerptText ? (
          <p className="pointer-events-none truncate text-xs text-paper-muted">{excerptText}</p>
        ) : (
          <p className="pointer-events-none text-xs italic text-paper-muted/70">
            Texte encore vierge.
          </p>
        )}
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-2">
        {track.status === 'COMPLETED' && (
          <Tag variant="success" mono className="pointer-events-none">
            Terminé
          </Tag>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(track.id);
          }}
          disabled={disabled}
          aria-label={`Retirer « ${track.title} » de l'album`}
          title="Retirer de l'album (le texte est conservé)"
          className="rounded p-1 text-paper-muted transition-colors hover:text-paper-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-accent disabled:opacity-40"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

interface SortableTracklistProps {
  tracks: AlbumTrack[];
  onReorder: (songIds: string[]) => void;
  onRemove: (songId: string) => void;
  disabled?: boolean;
}

/**
 * Tracklist d'album réordonnable par glisser-déposer (souris, tactile et clavier).
 * L'ordre est optimiste localement puis persisté via `onReorder`.
 */
export function SortableTracklist({
  tracks,
  onReorder,
  onRemove,
  disabled = false,
}: SortableTracklistProps): React.ReactElement {
  const [ordered, setOrdered] = useState<AlbumTrack[]>(tracks);

  useEffect(() => {
    setOrdered(tracks);
  }, [tracks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = ordered.findIndex((track) => track.id === active.id);
    const newIndex = ordered.findIndex((track) => track.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    onReorder(next.map((track) => track.id));
  };

  if (ordered.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-paper-border bg-paper-surface/50 px-6 py-12 text-center">
        <p className="font-serif text-xl text-paper-text">Tracklist vide</p>
        <p className="mt-2 text-sm text-paper-muted">
          Ajoutez un texte existant pour composer la tracklist de cet album.
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={ordered.map((track) => track.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-2" aria-label="Tracklist de l'album">
          {ordered.map((track, index) => (
            <SortableRow
              key={track.id}
              track={track}
              index={index}
              onRemove={onRemove}
              disabled={disabled}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
