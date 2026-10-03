import { describe, it, expect } from 'vitest';
import { validateEnv } from '../../src/config/env';

describe('Validation Zod des variables d environnement (env.ts)', () => {
  const validMockEnv = {
    NODE_ENV: 'test',
    PORT: '4000',
    HOST: '127.0.0.1',
    DATABASE_URL: 'postgresql://verso:verso@localhost:5432/verso_test',
    SESSION_SECRET: 'cle_secrete_de_test_au_moins_32_caracteres_longs',
    CLIENT_URL: 'http://localhost:5173',
    S3_ENDPOINT: 'http://localhost:9000',
    S3_REGION: 'us-east-1',
    S3_BUCKET_NAME: 'verso-audio',
    S3_ACCESS_KEY_ID: 'minioadmin',
    S3_SECRET_ACCESS_KEY: 'minioadminpassword',
  };

  it('doit valider avec succès un environnement complet et valide', () => {
    const config = validateEnv(validMockEnv);
    expect(config.NODE_ENV).toBe('test');
    expect(config.PORT).toBe(4000);
    expect(config.DATABASE_URL).toBe(validMockEnv.DATABASE_URL);
    expect(config.SESSION_SECRET).toBe(validMockEnv.SESSION_SECRET);
  });

  it('doit lever une exception explicite si DATABASE_URL est manquante', () => {
    const invalidEnv = { ...validMockEnv, DATABASE_URL: '' };
    expect(() => validateEnv(invalidEnv)).toThrowError(/DATABASE_URL est requise/);
  });

  it('doit lever une exception si SESSION_SECRET fait moins de 32 caractères', () => {
    const invalidEnv = { ...validMockEnv, SESSION_SECRET: 'trop_court' };
    expect(() => validateEnv(invalidEnv)).toThrowError(
      /SESSION_SECRET doit comporter au moins 32 caractères/,
    );
  });

  it('doit assigner les valeurs par défaut pour les champs optionnels', () => {
    const minimalEnv = {
      DATABASE_URL: 'postgresql://localhost:5432/verso',
      SESSION_SECRET: 'cle_secrete_de_test_au_moins_32_caracteres_longs',
    };
    const config = validateEnv(minimalEnv);
    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(4000);
    expect(config.S3_BUCKET_NAME).toBe('verso-audio');
  });
});
