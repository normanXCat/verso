import { z } from 'zod';

/**
 * Filtres combinables de l'espace personnel (FR-013).
 * `all` : tous les textes · `drafts` : brouillons · `completed` : terminés · `favorites` : favoris.
 */
export const songFilterSchema = z.enum(['all', 'drafts', 'completed', 'favorites']);
export type SongFilter = z.infer<typeof songFilterSchema>;

/** Ordre d'affichage des textes. */
export const songSortSchema = z.enum(['recent', 'oldest', 'title']);
export type SongSort = z.infer<typeof songSortSchema>;

/** Longueur maximale de l'extrait de paroles affiché dans les listes. */
export const SONG_EXCERPT_MAX_LENGTH = 160;

/** Requête de recherche plein texte et de filtrage de l'espace personnel. */
export const searchSongsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(200, 'La recherche ne peut pas dépasser 200 caractères')
    .optional()
    .default(''),
  filter: songFilterSchema.optional().default('all'),
  tag: z.string().trim().min(1).max(50).optional(),
  albumId: z.string().uuid("Identifiant d'album invalide").optional(),
  sort: songSortSchema.optional().default('recent'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type SearchSongsQuery = z.infer<typeof searchSongsQuerySchema>;

/** Élément de texte renvoyé par la recherche de l'espace personnel. */
export interface SongListItem {
  id: string;
  title: string;
  status: 'DRAFT' | 'COMPLETED';
  isFavorite: boolean;
  albumId: string | null;
  albumTitle: string | null;
  tags: string[];
  excerpt: string;
  updatedAt: Date | string;
  createdAt: Date | string;
}

/** Texte complet (édition) : la liste n'expose qu'un extrait, le détail expose le contenu intégral. */
export interface SongDetail extends SongListItem {
  content: string;
}

/** Réponse de l'API de recherche des textes. */
export interface SearchSongsResult {
  items: SongListItem[];
  total: number;
  query: string;
  filter: SongFilter;
  sort: SongSort;
  limit: number;
  offset: number;
}
