import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Check, RotateCcw, Trash2, X, CornerDownRight } from 'lucide-react';
import { commentsClient } from '../../lib/comments-client.js';
import { CommentComposer, type MentionableUser } from './CommentComposer.js';
import { useToast } from '../ui/Toast.js';

interface CommentThreadDrawerProps {
  songId: string;
  isOpen: boolean;
  onClose: () => void;
  collaborators?: MentionableUser[];
  activeCommentId?: string | null;
  onActiveCommentChange?: (commentId: string | null) => void;
  selectedLines?: { startLine: number; endLine: number } | null;
  onCommentCreated?: () => void;
  currentUserId?: string;
  isOwner?: boolean;
  onSelectAuthor?: (userId: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(val: string | Date): string {
  return dateFormatter.format(new Date(val));
}

export const CommentThreadDrawer: React.FC<CommentThreadDrawerProps> = ({
  songId,
  isOpen,
  onClose,
  collaborators = [],
  activeCommentId,
  onActiveCommentChange,
  selectedLines,
  onCommentCreated,
  currentUserId,
  isOwner = false,
  onSelectAuthor,
}) => {
  const [filter, setFilter] = useState<'open' | 'resolved'>('open');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['songs', songId, 'comments'],
    queryFn: () => commentsClient.listComments(songId),
    enabled: isOpen && Boolean(songId),
  });

  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string; startLine: number; endLine: number }) =>
      commentsClient.createComment(songId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', songId, 'comments'] });
      toast('Commentaire publié', 'success');
      onCommentCreated?.();
    },
    onError: (err: Error) => {
      toast(err.message || 'Échec de la publication', 'error');
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentsClient.replyToComment(commentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', songId, 'comments'] });
      setReplyingToId(null);
      toast('Réponse ajoutée', 'success');
    },
    onError: (err: Error) => {
      toast(err.message || 'Échec de la réponse', 'error');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (commentId: string) => commentsClient.resolveComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', songId, 'comments'] });
      toast('Discussion marquée comme résolue', 'success');
    },
  });

  const reopenMutation = useMutation({
    mutationFn: (commentId: string) => commentsClient.reopenComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', songId, 'comments'] });
      toast('Discussion réouverte', 'info');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentsClient.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs', songId, 'comments'] });
      toast('Commentaire supprimé', 'info');
    },
  });

  const filteredComments = comments.filter((c) =>
    filter === 'open' ? !c.isResolved : c.isResolved,
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col"
          aria-label="Volet des commentaires"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-neutral-100 text-sm">Discussions & Notes</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Onglets Filtres */}
          <div className="flex border-b border-neutral-800 bg-neutral-950/40">
            <button
              type="button"
              onClick={() => setFilter('open')}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
                filter === 'open'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              En cours ({comments.filter((c) => !c.isResolved).length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('resolved')}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
                filter === 'resolved'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              Résolus ({comments.filter((c) => c.isResolved).length})
            </button>
          </div>

          {/* Zone Nouveau Commentaire Ancré */}
          {selectedLines && (
            <div className="p-3 bg-neutral-800/40 border-b border-neutral-800">
              <div className="text-xs font-medium text-primary-300 mb-2">
                Nouveau commentaire sur{' '}
                {selectedLines.startLine === selectedLines.endLine
                  ? `le vers ${selectedLines.startLine}`
                  : `les vers ${selectedLines.startLine} à ${selectedLines.endLine}`}{' '}
                :
              </div>
              <CommentComposer
                placeholder="Rédigez votre remarque..."
                submitLabel="Commenter"
                collaborators={collaborators}
                onSubmit={async (content) => {
                  await createCommentMutation.mutateAsync({
                    content,
                    startLine: selectedLines.startLine,
                    endLine: selectedLines.endLine,
                  });
                }}
              />
            </div>
          )}

          {/* Liste des fils de discussion */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                Chargement des commentaires...
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                {filter === 'open'
                  ? 'Aucun commentaire en cours. Sélectionnez des vers pour en ajouter un.'
                  : 'Aucun commentaire résolu.'}
              </div>
            ) : (
              filteredComments.map((comment) => {
                const isSelected = activeCommentId === comment.id;
                const canDelete = isOwner || (currentUserId && comment.author.id === currentUserId);

                return (
                  <div
                    key={comment.id}
                    className={`rounded-lg border transition-all ${
                      isSelected
                        ? 'border-primary-500/80 bg-neutral-800/80 shadow-md ring-1 ring-primary-500/20'
                        : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                    }`}
                  >
                    {/* En-tête du fil */}
                    <div className="p-3 pb-2 flex items-start justify-between">
                      <button
                        type="button"
                        onClick={() => onSelectAuthor && onSelectAuthor(comment.author.id)}
                        className="flex items-center space-x-2 text-left hover:opacity-80 transition-opacity"
                      >
                        <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-200 overflow-hidden shrink-0">
                          {comment.author.avatarUrl ? (
                            <img
                              src={comment.author.avatarUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (comment.author.displayName?.[0] || 'U').toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-neutral-200 hover:text-primary-400">
                            {comment.author.displayName || 'Artiste'}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {formatDate(comment.createdAt)}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                          {comment.startLine === comment.endLine
                            ? `v. ${comment.startLine}`
                            : `v. ${comment.startLine}-${comment.endLine}`}
                        </span>

                        {comment.isResolved ? (
                          <button
                            type="button"
                            title="Rouvrir"
                            onClick={() => reopenMutation.mutate(comment.id)}
                            className="p-1 text-neutral-400 hover:text-primary-400 rounded transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Marquer comme résolu"
                            onClick={() => resolveMutation.mutate(comment.id)}
                            className="p-1 text-neutral-400 hover:text-emerald-400 rounded transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            title="Supprimer"
                            onClick={() => deleteMutation.mutate(comment.id)}
                            className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Contenu principal */}
                    <div className="px-3 pb-3 text-xs text-neutral-300 whitespace-pre-wrap">
                      {comment.content}
                    </div>

                    {/* Réponses */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="border-t border-neutral-800/80 bg-neutral-950/30 p-2.5 space-y-2.5">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex space-x-2 text-xs">
                            <CornerDownRight className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-neutral-300 text-[11px]">
                                  {reply.author.displayName || 'Artiste'}
                                </span>
                                <span className="text-[9px] text-neutral-500">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <div className="text-neutral-400 text-[11px] whitespace-pre-wrap mt-0.5">
                                {reply.content}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulaire de réponse rapide */}
                    {!comment.isResolved && (
                      <div className="p-2 border-t border-neutral-800/60 bg-neutral-950/20">
                        {replyingToId === comment.id ? (
                          <CommentComposer
                            placeholder="Votre réponse..."
                            submitLabel="Répondre"
                            collaborators={collaborators}
                            autoFocus
                            onCancel={() => setReplyingToId(null)}
                            onSubmit={async (content) => {
                              await replyMutation.mutateAsync({
                                commentId: comment.id,
                                content,
                              });
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToId(comment.id);
                              onActiveCommentChange?.(comment.id);
                            }}
                            className="text-[11px] text-primary-400 hover:text-primary-300 font-medium transition-colors"
                          >
                            Répondre au fil
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
