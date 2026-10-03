import { z } from 'zod';

/** Nom d'un tag personnel (thème, ambiance, humeur, style). */
export const tagNameSchema = z
  .string()
  .trim()
  .min(1, 'Le nom du tag est requis')
  .max(50, 'Le nom du tag ne peut pas dépasser 50 caractères');

/** Couleur hexadécimale d'un tag. */
export const tagColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hexadécimale invalide');

export const createTagSchema = z.object({
  name: tagNameSchema,
  color: tagColorSchema.optional(),
});

export const updateTagSchema = z.object({
  name: tagNameSchema.optional(),
  color: tagColorSchema.optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;

export interface TagItem {
  id: string;
  name: string;
  color: string;
}
