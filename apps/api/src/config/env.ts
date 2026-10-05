import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Localise le fichier `.env` le plus proche en remontant depuis le répertoire
 * courant. Indispensable dans le monorepo : l'API est lancée avec pour cwd
 * `apps/api` (`tsx watch src/server.ts`) alors que le `.env` documenté se trouve
 * à la racine du projet (`cp .env.example .env`). Sans cette remontée, dotenv
 * chercherait `apps/api/.env` et ignorerait silencieusement la configuration.
 */
function findEnvFile(startDir: string): string | null {
  let dir = startDir;
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

// En mode test, on ne charge pas le `.env` de la machine : la suite utilise des
// valeurs de repli déterministes (base `verso_test`) définies ci-dessous.
if (process.env.NODE_ENV !== 'test') {
  const envFilePath = findEnvFile(process.cwd());
  if (envFilePath) {
    dotenv.config({ path: envFilePath });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requise'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET doit comporter au moins 32 caractères'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:4000'),

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

  // Emails transactionnels (Optionnel en développement / local)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Verso <noreply@verso.fr>'),
});

export type Env = z.infer<typeof envSchema>;

/** Variables strictement requises hors mode test (sans valeur par défaut sûre). */
const REQUIRED_VARIABLES = ['DATABASE_URL', 'SESSION_SECRET'] as const;

export class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

export function validateEnv(customEnv: Record<string, string | undefined> = process.env): Env {
  const isTest = (customEnv.NODE_ENV || process.env.NODE_ENV) === 'test';
  const resolvedEnv = {
    ...customEnv,
    DATABASE_URL:
      customEnv.DATABASE_URL !== undefined
        ? customEnv.DATABASE_URL
        : isTest
          ? process.env.DATABASE_URL ||
            'postgresql://normanxcat@localhost/verso_test?host=/var/run/postgresql'
          : undefined,

    SESSION_SECRET:
      customEnv.SESSION_SECRET !== undefined
        ? customEnv.SESSION_SECRET
        : isTest
          ? 'test_session_secret_at_least_32_characters_long_for_security'
          : undefined,
  };

  // Message explicite nommant chaque variable manquante, avant toute autre erreur.
  const missingVariables = REQUIRED_VARIABLES.filter((name) => !resolvedEnv[name]);
  if (missingVariables.length > 0) {
    const details = missingVariables.map((name) => `  - ${name}: ${name} est requise`).join('\n');
    throw new EnvironmentValidationError(
      `Configuration invalide. Variables d'environnement manquantes :\n${details}\n` +
        `Copiez le fichier modèle à la racine du projet : « cp .env.example .env » puis renseignez les valeurs.`,
    );
  }

  const result = envSchema.safeParse(resolvedEnv);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new EnvironmentValidationError(
      `Configuration invalide. Erreurs dans les variables d'environnement :\n${errorDetails}`,
    );
  }

  return result.data;
}

export const env = validateEnv();
