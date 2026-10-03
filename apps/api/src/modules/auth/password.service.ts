import crypto from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';

/**
 * Hache un mot de passe en utilisant Argon2id avec des paramètres sécurisés.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Vérifie un mot de passe par rapport à son hachage Argon2id.
 */
export async function verifyPassword(passwordHash: string, candidate: string): Promise<boolean> {
  try {
    return await verify(passwordHash, candidate);
  } catch {
    return false;
  }
}

/**
 * Génère un jeton cryptographique aléatoire brut pour email et son empreinte SHA-256 pour stockage en base.
 * Règle constitutionnelle : le jeton brut n'est JAMAIS stocké en clair dans la base de données.
 */
export function generateEmailToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashEmailToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Calcule l'empreinte SHA-256 d'un jeton d'email brut.
 */
export function hashEmailToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
