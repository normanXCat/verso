import crypto from 'node:crypto';
import {
  Google,
  OAuth2Client,
  CodeChallengeMethod,
  generateCodeVerifier,
  generateState,
  type OAuth2Tokens,
} from 'arctic';
import { env } from '../../config/env.js';

export type OAuthProvider = 'google' | 'orcid';

export const OAUTH_PROVIDERS: readonly OAuthProvider[] = ['google', 'orcid'];

const GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';
const ORCID_AUTHORIZATION_ENDPOINT = 'https://orcid.org/oauth/authorize';
const ORCID_TOKEN_ENDPOINT = 'https://orcid.org/oauth/token';
const ORCID_USERINFO_ENDPOINT = 'https://orcid.org/oauth/userinfo';

/** Durée de vie d'un jeton temporaire de liaison de compte (10 minutes). */
const LINK_TOKEN_TTL_SECONDS = 10 * 60;

export type OAuthErrorCode = 'not_configured' | 'provider_error' | 'profile_unavailable';

export class OAuthError extends Error {
  constructor(
    message: string,
    public readonly code: OAuthErrorCode,
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

/** Profil normalisé renvoyé par un fournisseur OAuth. */
export interface OAuthProfile {
  providerAccountId: string;
  email: string | null;
  displayName: string | null;
}

/** Données encapsulées dans un jeton temporaire de liaison de compte. */
export interface OAuthLinkPayload {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
}

/** Requête d'autorisation OAuth prête à rediriger. */
export interface AuthorizationRequest {
  url: string;
  state: string;
  codeVerifier: string;
}

interface ProviderCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Vérifie qu'une chaîne correspond à un fournisseur OAuth supporté.
 */
export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Résout les identifiants OAuth d'un fournisseur depuis les variables d'environnement.
 */
function getCredentials(provider: OAuthProvider): ProviderCredentials | null {
  const baseUrl = env.API_URL.replace(/\/+$/, '');
  const redirectUri = `${baseUrl}/api/auth/oauth/${provider}/callback`;

  if (provider === 'google') {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return null;
    }
    return {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    };
  }

  if (!env.ORCID_CLIENT_ID || !env.ORCID_CLIENT_SECRET) {
    return null;
  }
  return {
    clientId: env.ORCID_CLIENT_ID,
    clientSecret: env.ORCID_CLIENT_SECRET,
    redirectUri,
  };
}

/**
 * Indique si un fournisseur OAuth est correctement configuré via les variables d'environnement.
 */
export function isProviderConfigured(provider: OAuthProvider): boolean {
  return getCredentials(provider) !== null;
}

/**
 * Construit l'URL d'autorisation du fournisseur avec un `state` cryptographique et un défi PKCE (S256).
 */
export function createAuthorizationRequest(provider: OAuthProvider): AuthorizationRequest {
  const credentials = getCredentials(provider);
  if (!credentials) {
    throw new OAuthError(`Fournisseur OAuth non configuré : ${provider}`, 'not_configured');
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  let url: URL;
  if (provider === 'google') {
    const client = new Google(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri,
    );
    url = client.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);
  } else {
    const client = new OAuth2Client(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri,
    );
    url = client.createAuthorizationURLWithPKCE(
      ORCID_AUTHORIZATION_ENDPOINT,
      state,
      CodeChallengeMethod.S256,
      codeVerifier,
      ['openid'],
    );
  }

  return { url: url.toString(), state, codeVerifier };
}

/**
 * Échange le code d'autorisation contre des jetons auprès du fournisseur (validation PKCE).
 */
export async function exchangeCodeForTokens(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string,
): Promise<OAuth2Tokens> {
  const credentials = getCredentials(provider);
  if (!credentials) {
    throw new OAuthError(`Fournisseur OAuth non configuré : ${provider}`, 'not_configured');
  }

  try {
    if (provider === 'google') {
      const client = new Google(
        credentials.clientId,
        credentials.clientSecret,
        credentials.redirectUri,
      );
      return await client.validateAuthorizationCode(code, codeVerifier);
    }

    const client = new OAuth2Client(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri,
    );
    return await client.validateAuthorizationCode(ORCID_TOKEN_ENDPOINT, code, codeVerifier);
  } catch {
    throw new OAuthError("Échec de l'échange du code d'autorisation", 'provider_error');
  }
}

/**
 * Récupère et normalise le profil utilisateur auprès du point de terminaison userinfo du fournisseur.
 */
export async function fetchOAuthProfile(
  provider: OAuthProvider,
  tokens: OAuth2Tokens,
): Promise<OAuthProfile> {
  const endpoint = provider === 'google' ? GOOGLE_USERINFO_ENDPOINT : ORCID_USERINFO_ENDPOINT;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });
  } catch {
    throw new OAuthError('Échec de la récupération du profil fournisseur', 'provider_error');
  }

  if (!response.ok) {
    throw new OAuthError('Réponse invalide du fournisseur', 'provider_error');
  }

  const data = (await response.json()) as Record<string, unknown>;
  const providerAccountId = typeof data.sub === 'string' ? data.sub : null;
  if (!providerAccountId) {
    throw new OAuthError('Identifiant de compte fournisseur introuvable', 'profile_unavailable');
  }

  const rawEmail = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const rawName = typeof data.name === 'string' ? data.name.trim() : '';

  return {
    providerAccountId,
    email: rawEmail.length > 0 ? rawEmail : null,
    displayName: rawName.length > 0 ? rawName.slice(0, 50) : null,
  };
}

function signLinkTokenBody(body: string): string {
  return crypto.createHmac('sha256', env.SESSION_SECRET).update(body).digest('base64url');
}

/**
 * Génère un jeton temporaire signé (HMAC) encapsulant la liaison OAuth à confirmer par mot de passe.
 */
export function createLinkToken(payload: OAuthLinkPayload): string {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + LINK_TOKEN_TTL_SECONDS,
    }),
  ).toString('base64url');

  return `${body}.${signLinkTokenBody(body)}`;
}

/**
 * Vérifie et décode un jeton de liaison. Renvoie `null` si la signature, le format ou l'expiration sont invalides.
 */
export function verifyLinkToken(token: string): OAuthLinkPayload | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = signLinkTokenBody(body);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
    const exp = parsed.exp;
    const provider = parsed.provider;
    const providerAccountId = parsed.providerAccountId;
    const email = parsed.email;

    if (typeof exp !== 'number' || exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (typeof provider !== 'string' || !isOAuthProvider(provider)) {
      return null;
    }
    if (typeof providerAccountId !== 'string' || typeof email !== 'string') {
      return null;
    }

    return { provider, providerAccountId, email };
  } catch {
    return null;
  }
}
