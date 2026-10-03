import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requise'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET doit comporter au moins 32 caractères'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  // Stockage d'objets compatible S3
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET_NAME: z.string().default('verso-audio'),
  S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().default('minioadminpassword'),

  // OAuth Google (Optionnel en développement initial)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // OAuth ORCID (Optionnel en développement initial)
  ORCID_CLIENT_ID: z.string().optional(),
  ORCID_CLIENT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(customEnv: Record<string, string | undefined> = process.env): Env {
  const isTest = (customEnv.NODE_ENV || process.env.NODE_ENV) === 'test';
  const resolvedEnv = {
    ...customEnv,
    DATABASE_URL:
      customEnv.DATABASE_URL !== undefined
        ? customEnv.DATABASE_URL
        : isTest
          ? 'postgresql://verso:verso@localhost:5432/verso_test'
          : undefined,
    SESSION_SECRET:
      customEnv.SESSION_SECRET !== undefined
        ? customEnv.SESSION_SECRET
        : isTest
          ? 'test_session_secret_at_least_32_characters_long_for_security'
          : undefined,
  };
  const result = envSchema.safeParse(resolvedEnv);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(
      `Configuration invalide. Erreurs dans les variables d'environnement :\n${errorDetails}`,
    );
  }

  return result.data;
}

export const env = validateEnv();
