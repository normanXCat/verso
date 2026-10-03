import { z } from 'zod';

export const albumTitleSchema = z
  .string()
  .trim()
  .min(1, "Le titre de l'album est requis")
  .max(200, "Le titre de l'album ne peut pas dépasser 200 caractères");

export const albumDescriptionSchema = z
  .string()
  .trim()
  .max(2000, 'La description ne peut pas dépasser 2000 caractères');

/** Clé de stockage S3 de la pochette (optionnelle). */
export const albumCoverImageKeySchema = z
  .string()
  .trim()
  .min(1, 'Clé de pochette invalide')
  .max(512, 'Clé de pochette trop longue');

export const createAlbumSchema = z.object({
  title: albumTitleSchema,
  description: albumDescriptionSchema.optional(),
  coverImageKey: albumCoverImageKeySchema.nullish(),
});

export const updateAlbumSchema = z
  .object({
    title: albumTitleSchema.optional(),
    description: albumDescriptionSchema.nullable().optional(),
    coverImageKey: albumCoverImageKeySchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Aucune modification fournie',
  });

export const albumIdParamSchema = z.object({
  id: z.string().uuid("Identifiant d'album invalide"),
});

export const albumTrackParamSchema = z.object({
  id: z.string().uuid("Identifiant d'album invalide"),
  songId: z.string().uuid('Identifiant de texte invalide'),
});

/** Ajout d'un texte existant à un album. */
export const addTrackSchema = z.object({
  songId: z.string().uuid('Identifiant de texte invalide'),
});

/** Réordonnancement par glisser-déposer : liste complète et ordonnée des pistes. */
export const reorderTracksSchema = z.object({
  songIds: z
    .array(z.string().uuid('Identifiant de texte invalide'))
    .min(1, 'La tracklist ne peut pas être vide')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'La tracklist contient des doublons',
    }),
});

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type AddTrackInput = z.infer<typeof addTrackSchema>;
export type ReorderTracksInput = z.infer<typeof reorderTracksSchema>;

/** Piste d'un album exposée dans la tracklist ordonnée. */
export interface AlbumTrack {
  id: string;
  title: string;
  position: number;
  status: 'DRAFT' | 'COMPLETED';
  excerpt: string;
  updatedAt: Date | string;
}

/** Album résumé pour la liste de l'espace personnel. */
export interface AlbumListItem {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  tracksCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Album complet avec sa tracklist ordonnée. */
export interface AlbumDetail extends Omit<AlbumListItem, 'tracksCount'> {
  tracks: AlbumTrack[];
}
