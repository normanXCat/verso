import { z } from 'zod';

/** Taille maximale d'une instrumentale : 75 Mo (FR-034). */
export const MAX_AUDIO_SIZE_BYTES = 75 * 1024 * 1024;

/** Nombre maximal d'instrumentales rattachables à un texte (FR-034). */
export const MAX_INSTRUMENTALS_PER_SONG = 3;

/** Formats audio acceptés (FR-034). */
export const audioMimeTypeSchema = z.enum(['audio/mpeg', 'audio/wav']);
export type AudioMimeType = z.infer<typeof audioMimeTypeSchema>;

export const instrumentalTitleSchema = z
  .string()
  .trim()
  .min(1, "Le titre de l'instrumentale est requis")
  .max(200, 'Le titre ne peut pas dépasser 200 caractères');

/** Tonalité musicale libre (ex. « Dm », « F# »). */
export const musicalKeySchema = z.string().trim().min(1).max(16);

export const bpmSchema = z.coerce
  .number()
  .int('Le BPM doit être un entier')
  .min(20, 'Le BPM doit être au moins 20')
  .max(300, 'Le BPM ne peut pas dépasser 300');

/** Demande d'URL présignée de téléversement. */
export const uploadUrlSchema = z.object({
  filename: z.string().trim().min(1, 'Nom de fichier requis').max(255),
  mimeType: audioMimeTypeSchema,
  sizeBytes: z.coerce
    .number()
    .int()
    .positive('La taille doit être positive')
    .max(MAX_AUDIO_SIZE_BYTES, 'Le fichier dépasse la limite de 75 Mo'),
});

export type UploadUrlInput = z.infer<typeof uploadUrlSchema>;

/** Confirmation du téléversement et enregistrement en base. */
export const confirmInstrumentalSchema = z.object({
  s3Key: z.string().trim().min(1, 'Clé de stockage requise').max(512),
  title: instrumentalTitleSchema,
  mimeType: audioMimeTypeSchema,
  sizeBytes: z.coerce.number().int().positive().max(MAX_AUDIO_SIZE_BYTES),
  durationSeconds: z.coerce
    .number()
    .positive()
    .max(60 * 60 * 24)
    .optional(),
  bpm: bpmSchema.optional(),
  musicalKey: musicalKeySchema.optional(),
});

export type ConfirmInstrumentalInput = z.infer<typeof confirmInstrumentalSchema>;

/** Mise à jour des métadonnées d'une instrumentale ou bascule de piste active. */
export const updateInstrumentalSchema = z
  .object({
    title: instrumentalTitleSchema.optional(),
    bpm: bpmSchema.nullable().optional(),
    musicalKey: musicalKeySchema.nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Aucune modification fournie',
  });

export type UpdateInstrumentalInput = z.infer<typeof updateInstrumentalSchema>;

export const instrumentalIdParamSchema = z.object({
  id: z.string().uuid("Identifiant d'instrumentale invalide"),
});

/** Instrumentale exposée par l'API (avec URL de lecture signée à la volée). */
export interface InstrumentalItem {
  id: string;
  songId: string;
  title: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  bpm: number | null;
  musicalKey: string | null;
  isActive: boolean;
  downloadUrl: string | null;
  createdAt: Date | string;
}

/** Réponse d'une demande d'URL présignée de téléversement. */
export interface UploadUrlResult {
  uploadUrl: string;
  s3Key: string;
  expiresInSeconds: number;
}
