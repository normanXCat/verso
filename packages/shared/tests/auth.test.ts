import { describe, expect, it } from 'vitest';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../src/index.js';

describe("Schémas Zod d'authentification (@verso/shared)", () => {
  describe('registerSchema', () => {
    it("doit valider un payload d'inscription correct", () => {
      const valid = {
        email: 'Artiste@Verso.fr ',
        password: 'Password123!',
        displayName: 'MC Plume',
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('artiste@verso.fr');
        expect(result.data.displayName).toBe('MC Plume');
      }
    });

    it('doit refuser un mot de passe trop court ou sans majuscule/chiffre/symbole', () => {
      expect(registerSchema.safeParse({ email: 'test@verso.fr', password: 'court' }).success).toBe(
        false,
      );
      expect(
        registerSchema.safeParse({ email: 'test@verso.fr', password: 'password123!' }).success,
      ).toBe(false);
      expect(
        registerSchema.safeParse({ email: 'test@verso.fr', password: 'PASSWORD123!' }).success,
      ).toBe(false);
      expect(
        registerSchema.safeParse({ email: 'test@verso.fr', password: 'PasswordNoSpecial1' })
          .success,
      ).toBe(false);
      expect(
        registerSchema.safeParse({ email: 'test@verso.fr', password: 'Password!NoNumber' }).success,
      ).toBe(false);
    });

    it('doit refuser un email invalide', () => {
      expect(
        registerSchema.safeParse({ email: 'not-an-email', password: 'Password123!' }).success,
      ).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('doit valider les identifiants de connexion avec rememberMe par défaut', () => {
      const result = loginSchema.safeParse({
        email: 'artiste@verso.fr',
        password: 'any-password-here',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rememberMe).toBe(false);
      }
    });
  });

  describe('forgotPasswordSchema & resetPasswordSchema', () => {
    it('doit valider la demande de réinitialisation', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'artiste@verso.fr' }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: 'invalide' }).success).toBe(false);
    });

    it('doit valider la réinitialisation avec token et mot de passe fort', () => {
      expect(
        resetPasswordSchema.safeParse({
          token: 'token-abc-123',
          newPassword: 'NewPassword123!',
        }).success,
      ).toBe(true);

      expect(
        resetPasswordSchema.safeParse({
          token: '',
          newPassword: 'NewPassword123!',
        }).success,
      ).toBe(false);
    });
  });

  describe('verifyEmailSchema', () => {
    it('doit valider le token de vérification', () => {
      expect(verifyEmailSchema.safeParse({ token: 'tok_123' }).success).toBe(true);
      expect(verifyEmailSchema.safeParse({ token: '' }).success).toBe(false);
    });
  });
});
