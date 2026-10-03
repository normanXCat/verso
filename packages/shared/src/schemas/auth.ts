import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
  .regex(/[^a-zA-Z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Adresse email invalide')
  .max(255, "L'adresse email ne peut pas dépasser 255 caractères");

export const displayNameSchema = z
  .string()
  .trim()
  .max(50, 'Le nom d’artiste ne doit pas dépasser 50 caractères')
  .optional();

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis'),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Le jeton de réinitialisation est requis'),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Le jeton de vérification est requis'),
});

export const linkOAuthAccountSchema = z.object({
  linkToken: z.string().min(1, 'Le jeton de liaison est requis'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type LinkOAuthAccountInput = z.infer<typeof linkOAuthAccountSchema>;

export interface UserPublic {
  id: string;
  email: string;
  displayName: string | null;
  emailVerified: Date | string | null;
  themePreference?: 'LIGHT' | 'DARK' | 'SYSTEM';
  createdAt?: Date | string;
}

export interface SessionInfo {
  id: string;
  isCurrent: boolean;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date | string;
  lastActiveAt: Date | string;
}
