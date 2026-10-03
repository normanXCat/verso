import { z } from 'zod';
import { tagNameSchema } from './tag.js';

/** Statut d'un texte. */
export const songStatusSchema = z.enum(['DRAFT', 'COMPLETED']);
export type SongStatus = z.infer<typeof songStatusSchema>;

export const songTitleSchema = z
  .string()
  .trim()
  .min(1, 'Le titre est requis')
  .max(120, 'Le titre ne peut pas dépasser 120 caractères');

/** Contenu des paroles. Limite généreuse pour préserver la frappe continue. */
export const songContentSchema = z
  .string()
  .max(50_000, 'Le texte dépasse la taille maximale autorisée');

export const MAX_TAGS_PER_SONG = 20;

export const createSongSchema = z.object({
  title: songTitleSchema.optional().default('Sans titre'),
  content: songContentSchema.optional().default(''),
  albumId: z.string().uuid("Identifiant d'album invalide").nullish(),
  tags: z.array(tagNameSchema).max(MAX_TAGS_PER_SONG).optional(),
});

export const updateSongSchema = z
  .object({
    title: songTitleSchema.optional(),
    content: songContentSchema.optional(),
    status: songStatusSchema.optional(),
    isFavorite: z.boolean().optional(),
    albumId: z.string().uuid("Identifiant d'album invalide").nullable().optional(),
    tags: z.array(tagNameSchema).max(MAX_TAGS_PER_SONG).optional(),
    // Force l'archivage d'un instantané immuable même sans intervalle d'inactivité.
    createVersion: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Aucune modification fournie',
  });

export const songIdParamSchema = z.object({
  id: z.string().uuid('Identifiant de texte invalide'),
});

export type CreateSongInput = z.infer<typeof createSongSchema>;
export type UpdateSongInput = z.infer<typeof updateSongSchema>;
