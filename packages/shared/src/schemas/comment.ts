import { z } from 'zod';

export const createCommentSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, 'Le commentaire ne peut pas être vide')
      .max(2000, 'Le commentaire ne peut pas dépasser 2000 caractères'),
    startLine: z.number().int().positive('La ligne de début doit être supérieure ou égale à 1'),
    endLine: z.number().int().positive('La ligne de fin doit être supérieure ou égale à 1'),
  })
  .refine((data) => data.startLine <= data.endLine, {
    message: 'La ligne de début doit être inférieure ou égale à la ligne de fin',
    path: ['endLine'],
  });

export const replyCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'La réponse ne peut pas être vide')
    .max(2000, 'La réponse ne peut pas dépasser 2000 caractères'),
});

export const commentQuerySchema = z.object({
  isResolved: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ReplyCommentInput = z.infer<typeof replyCommentSchema>;
export type CommentQuery = z.infer<typeof commentQuerySchema>;
