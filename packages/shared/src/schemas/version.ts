import { z } from 'zod';

export const versionIdParamSchema = z.object({
  id: z.string().uuid('Identifiant de texte invalide'),
  versionId: z.string().uuid('Identifiant de version invalide'),
});

export type VersionIdParam = z.infer<typeof versionIdParamSchema>;

/** Version horodatée et immuable d'un texte, conservée indéfiniment. */
export interface SongVersionItem {
  id: string;
  title: string;
  content: string;
  createdAt: Date | string;
}

/** Longueur maximale de l'extrait d'aperçu d'une version dans la liste. */
export const VERSION_EXCERPT_MAX_LENGTH = 160;
