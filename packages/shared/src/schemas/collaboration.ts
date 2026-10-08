import { z } from 'zod';

export const MAX_ACTIVE_COLLABORATORS_PER_SONG = 10;

export const collaboratorRoleSchema = z.enum(['CO_AUTHOR', 'COMMENTER', 'READER']);

export const collaboratorStatusSchema = z.enum(['ACTIVE', 'REVOKED', 'LEFT']);

export const invitationStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'REVOKED',
  'EXPIRED',
]);

export const createInvitationSchema = z.object({
  recipient: z.string().trim().min(1, "Le nom d'utilisateur ou l'email est requis").max(255),
  role: collaboratorRoleSchema,
  expiresInDays: z.number().int().min(1).max(30).optional().default(7),
});

export const updateCollaboratorRoleSchema = z.object({
  role: collaboratorRoleSchema,
});

export const sharedWithMeQuerySchema = z.object({
  role: collaboratorRoleSchema.optional(),
  ownerId: z.string().optional(),
  type: z.enum(['song', 'album', 'all']).default('all'),
});

export type CollaboratorRole = z.infer<typeof collaboratorRoleSchema>;
export type CollaboratorStatus = z.infer<typeof collaboratorStatusSchema>;
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;
export type CreateInvitationInput = z.input<typeof createInvitationSchema>;
export type UpdateCollaboratorRoleInput = z.infer<typeof updateCollaboratorRoleSchema>;
export type SharedWithMeQuery = z.infer<typeof sharedWithMeQuerySchema>;
