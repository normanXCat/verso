import { z } from 'zod';

export const reportReasonSchema = z.enum([
  'HARASSMENT',
  'SPAM',
  'INAPPROPRIATE_CONTENT',
  'COPYRIGHT_INFRINGEMENT',
  'OTHER',
]);

export const reportStatusSchema = z.enum(['PENDING', 'REVIEWED', 'DISMISSED', 'RESOLVED']);

export const createAbuseReportSchema = z.object({
  reason: reportReasonSchema,
  details: z
    .string()
    .trim()
    .max(2000, 'Les détails ne peuvent pas dépasser 2000 caractères')
    .optional(),
  reportedUserId: z.string().optional(),
  songId: z.string().optional(),
  commentId: z.string().optional(),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Le nom d'artiste ne peut pas être vide")
    .max(50, "Le nom d'artiste ne peut pas dépasser 50 caractères")
    .optional(),
  avatarUrl: z.string().url('URL d’avatar invalide').max(500).nullable().optional(),
  bio: z
    .string()
    .trim()
    .max(280, 'La biographie ne peut pas dépasser 280 caractères')
    .nullable()
    .optional(),
});

export const searchUsersQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'La recherche nécessite au moins 1 caractère')
    .max(100, 'La recherche ne peut pas dépasser 100 caractères'),
});

export type ReportReason = z.infer<typeof reportReasonSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type CreateAbuseReportInput = z.infer<typeof createAbuseReportSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
