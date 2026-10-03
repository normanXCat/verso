import { describe, expect, it } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateEmailToken,
  hashEmailToken,
} from '../../src/modules/auth/password.service.js';

describe('Service de mot de passe et jetons email (password.service)', () => {
  it('doit hacher un mot de passe avec Argon2id et le vérifier', async () => {
    const raw = 'Password123!';
    const hashed = await hashPassword(raw);

    expect(hashed).toContain('$argon2id$');
    expect(await verifyPassword(hashed, raw)).toBe(true);
    expect(await verifyPassword(hashed, 'MauvaisMotDePasse')).toBe(false);
  });

  it('doit retourner false si le hachage est corrompu ou invalide', async () => {
    expect(await verifyPassword('invalid-hash', 'Password123!')).toBe(false);
  });

  it("doit générer un token d'email brut et son empreinte SHA-256 cohérente", () => {
    const { rawToken, tokenHash } = generateEmailToken();

    expect(rawToken).toHaveLength(64);
    expect(tokenHash).toHaveLength(64);
    expect(hashEmailToken(rawToken)).toBe(tokenHash);
    expect(rawToken).not.toBe(tokenHash);
  });
});
