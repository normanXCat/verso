import { z } from 'zod';
import { songStatusSchema } from './song.js';

/** Préfixe lisible des jetons de partage bruts (`sec_...`). */
export const SHARE_TOKEN_PREFIX = 'sec_';

/** Longueur maximale de la date d'expiration optionnelle, en jours. */
export const SHARE_LINK_MAX_EXPIRY_DAYS = 365;

/** Limite stricte de consultation publique par IP (FR-044). */
export const SHARE_RATE_LIMIT_MAX = 30;
export const SHARE_RATE_LIMIT_WINDOW = '1 minute';

/** Expiration optionnelle d'un lien de partage (en jours), ou `null` pour sans expiration. */
export const createShareLinkSchema = z.object({
  expiresInDays: z
    .number()
    .int("La durée d'expiration doit être un nombre entier de jours")
    .positive("La durée d'expiration doit être positive")
    .max(
      SHARE_LINK_MAX_EXPIRY_DAYS,
      `La durée d'expiration ne peut pas dépasser ${SHARE_LINK_MAX_EXPIRY_DAYS} jours`,
    )
    .nullable()
    .optional(),
});

/** Paramètres de création/révocation d'un lien rattaché à un texte. */
export const shareLinkParamSchema = z.object({
  id: z.string().uuid('Identifiant de texte invalide'),
  linkId: z.string().uuid('Identifiant de lien invalide'),
});

/** Paramètre de consultation publique par jeton brut. */
export const publicShareTokenParamSchema = z.object({
  token: z
    .string()
    .min(16, 'Jeton de partage invalide')
    .max(200, 'Jeton de partage invalide')
    .regex(/^sec_[A-Za-z0-9_-]+$/, 'Jeton de partage invalide'),
});

export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
export type ShareLinkParam = z.infer<typeof shareLinkParamSchema>;
export type PublicShareTokenParam = z.infer<typeof publicShareTokenParamSchema>;

/** Lien de partage privé tel que présenté à son auteur (le jeton brut n'est jamais rejoué). */
export interface ShareLinkItem {
  id: string;
  expiresAt: Date | string | null;
  isRevoked: boolean;
  accessCount: number;
  lastAccessedAt: Date | string | null;
  createdAt: Date | string;
}

/**
 * Lien fraîchement créé : le jeton brut (et donc l'URL complète) n'est exposé
 * qu'une seule fois, au moment de la création.
 */
export interface CreatedShareLink extends ShareLinkItem {
  shareUrl: string;
}

/**
 * Texte exposé anonymement via un lien de partage : lecture seule, sans aucune
 * donnée personnelle de l'auteur (ni email, ni identifiant de compte).
 */
export interface PublicSharedSong {
  title: string;
  authorDisplayName: string;
  content: string;
  status: z.infer<typeof songStatusSchema>;
  updatedAt: Date | string;
}
