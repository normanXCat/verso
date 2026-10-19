import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button.js';

export interface MentionableUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface CommentComposerProps {
  placeholder?: string;
  submitLabel?: string;
  collaborators?: MentionableUser[];
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
  placeholder = 'Ajouter un commentaire... (utilisez @ pour mentionner)',
  submitLabel = 'Envoyer',
  collaborators = [],
  onSubmit,
  onCancel,
  autoFocus = false,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gestion des mentions
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Filtrer les collaborateurs mentionnables
  const filteredCollaborators =
    mentionQuery !== null
      ? collaborators.filter((c) => {
          const name = (c.displayName || '').toLowerCase();
          return name.includes(mentionQuery.toLowerCase());
        })
      : [];

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setError(null);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\u00C0-\u017F-]*)$/);

    if (lastAtMatch) {
      setMentionQuery(lastAtMatch[1]);
      setMentionIndex(lastAtMatch.index!);
      setSelectedSuggestionIndex(0);
    } else {
      setMentionQuery(null);
      setMentionIndex(-1);
    }
  };

  const insertMention = (user: MentionableUser) => {
    if (mentionIndex === -1 || !textareaRef.current) return;

    const name = user.displayName || 'Artiste';
    const beforeMention = content.slice(0, mentionIndex);
    const afterMention = content.slice(textareaRef.current.selectionStart);
    const newContent = `${beforeMention}@${name} ${afterMention}`;

    setContent(newContent);
    setMentionQuery(null);
    setMentionIndex(-1);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeMention.length + name.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredCollaborators.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev + 1) % filteredCollaborators.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev <= 0 ? filteredCollaborators.length - 1 : prev - 1,
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredCollaborators[selectedSuggestionIndex];
        if (selected) {
          insertMention(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      setError('Le commentaire ne peut pas dépasser 2000 caractères.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(trimmed);
      setContent('');
      setMentionQuery(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          maxLength={2000}
          disabled={isSubmitting}
          className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none transition-colors"
        />

        {/* Menu déroulant des suggestions de mentions */}
        {mentionQuery !== null && filteredCollaborators.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 bottom-full mb-1 w-64 max-h-48 overflow-y-auto bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50 py-1"
          >
            <div className="px-3 py-1 text-xs font-semibold text-neutral-400 border-b border-neutral-700/50">
              Mentionner un collaborateur
            </div>
            {filteredCollaborators.map((user, idx) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                className={`w-full flex items-center space-x-2 px-3 py-1.5 text-sm text-left transition-colors ${
                  idx === selectedSuggestionIndex
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-neutral-200 hover:bg-neutral-700/50'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300 overflow-hidden flex-shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user.displayName?.[0] || 'U').toUpperCase()
                  )}
                </div>
                <span className="truncate">{user.displayName || 'Artiste'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">{content.length}/2000 caractères</span>
        <div className="flex items-center space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? 'Envoi...' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
};
