import { z } from 'zod';

export const creditRoleSchema = z.enum(['AUTHOR', 'FEATURING', 'PRODUCER', 'COMPOSER']);

export const creditItemInputSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Le nom ou blaze du crédité est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  role: creditRoleSchema,
  percentage: z
    .number()
    .min(0, 'Le pourcentage doit être supérieur ou égal à 0')
    .max(100, 'Le pourcentage ne peut pas dépasser 100')
    .nullable()
    .optional(),
  order: z.number().int().default(0),
  userId: z.string().nullable().optional(),
});

export const updateSongCreditsSchema = z.object({
  credits: z
    .array(creditItemInputSchema)
    .max(50, 'Le nombre maximal de crédits est de 50 par morceau'),
});

export type CreditRole = z.infer<typeof creditRoleSchema>;
export type CreditItemInput = z.infer<typeof creditItemInputSchema>;
export type UpdateSongCreditsInput = z.infer<typeof updateSongCreditsSchema>;
