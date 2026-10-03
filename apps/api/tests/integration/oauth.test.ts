import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';

// Configuration OAuth de test (doit être définie avant le chargement du module d'environnement).
process.env.NODE_ENV = 'test';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.ORCID_CLIENT_ID = 'test-orcid-client-id';
process.env.ORCID_CLIENT_SECRET = 'test-orcid-client-secret';
process.env.API_URL = 'http://localhost:4000';
process.env.CLIENT_URL = 'http://localhost:5173';

const { buildApp } = await import('../../src/app.js');
const { prisma } = await import('../../src/config/prisma.js');
const { hashPassword } = await import('../../src/modules/auth/password.service.js');

type AppPrisma = PrismaClient;

const GOOGLE_USER = {
  sub: 'google-account-1',
  email: 'artiste.google@verso.fr',
  name: 'MC Plume',
};

const ORCID_USER = {
  sub: '0000-0002-1825-0097',
  email: 'artiste.orcid@verso.fr',
  name: 'Rimeur Orcid',
};

const PASSWORD = 'Password123!';

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function installFetchMock(users: {
  google: Record<string, unknown>;
  orcid: Record<string, unknown>;
}): void {
  const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = input instanceof Request ? input.url : input.toString();

    if (url.includes('oauth2.googleapis.com/token')) {
      return jsonResponse({ access_token: 'google-access', token_type: 'Bearer', expires_in: 3600 });
    }
    if (url.includes('openidconnect.googleapis.com')) {
      return jsonResponse(users.google);
    }
    if (url.includes('orcid.org/oauth/token')) {
      return jsonResponse({ access_token: 'orcid-access', token_type: 'Bearer', expires_in: 3600 });
    }
    if (url.includes('orcid.org/oauth/userinfo')) {
      return jsonResponse(users.orcid);
    }

    throw new Error(`Requête réseau inattendue dans les tests : ${url}`);
  });

  vi.stubGlobal('fetch', fetchMock);
}

describe("Tests d'intégration : Flux OAuth Google et ORCID (/api/auth/oauth)", () => {
  let app: FastifyInstance;
  let db: AppPrisma;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    db = prisma;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await db.account.deleteMany();
    await db.emailToken.deleteMany();
    await db.session.deleteMany();
    await db.user.deleteMany();
    installFetchMock({ google: GOOGLE_USER, orcid: ORCID_USER });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function beginOAuth(provider: 'google' | 'orcid'): Promise<{
    response: Awaited<ReturnType<FastifyInstance['inject']>>;
    state: string;
    codeVerifier: string;
  }> {
    const response = await app.inject({ method: 'GET', url: `/api/auth/oauth/${provider}` });
    const state = response.cookies.find((c) => c.name === 'oauth_state')?.value ?? '';
    const codeVerifier = response.cookies.find((c) => c.name === 'oauth_code_verifier')?.value ?? '';
    return { response, state, codeVerifier };
  }

  function completeOAuth(
    provider: 'google' | 'orcid',
    credentials: { state: string; codeVerifier: string },
    code = 'test-authorization-code',
  ): ReturnType<FastifyInstance['inject']> {
    return app.inject({
      method: 'GET',
      url: `/api/auth/oauth/${provider}/callback?code=${code}&state=${encodeURIComponent(credentials.state)}`,
      cookies: {
        oauth_state: credentials.state,
        oauth_code_verifier: credentials.codeVerifier,
      },
    });
  }

  describe('GET /api/auth/oauth/:provider', () => {
    it('redirige vers Google avec un state aléatoire et un défi PKCE S256', async () => {
      const { response } = await beginOAuth('google');

      expect(response.statusCode).toBe(302);
      const location = response.headers.location as string;
      const url = new URL(location);

      expect(url.hostname).toBe('accounts.google.com');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('code_challenge')).toBeTruthy();
      expect(url.searchParams.get('scope')).toContain('email');
      expect(url.searchParams.get('state')).toBeTruthy();
    });

    it('redirige vers ORCID avec un défi PKCE S256', async () => {
      const { response } = await beginOAuth('orcid');

      expect(response.statusCode).toBe(302);
      const url = new URL(response.headers.location as string);
      expect(url.hostname).toBe('orcid.org');
      expect(url.pathname).toBe('/oauth/authorize');
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('rejette un fournisseur inconnu avec un statut 400', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/auth/oauth/github' });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /api/auth/oauth/:provider/callback", () => {
    it('crée le compte et ouvre une session lors du premier callback Google', async () => {
      const credentials = await beginOAuth('google');
      const callback = await completeOAuth('google', credentials);

      expect(callback.statusCode).toBe(302);
      expect(callback.headers.location).toBe('http://localhost:5173/?oauth=success');

      const sessionCookie = callback.cookies.find((c) => c.name === 'session_id');
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.httpOnly).toBe(true);

      const user = await db.user.findUnique({ where: { email: GOOGLE_USER.email } });
      expect(user).not.toBeNull();
      expect(user?.displayName).toBe('MC Plume');
      expect(user?.passwordHash).toBeNull();

      const account = await db.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'GOOGLE',
            providerAccountId: GOOGLE_USER.sub,
          },
        },
      });
      expect(account).not.toBeNull();
      expect(account?.userId).toBe(user?.id);
    });

    it('connecte un compte OAuth déjà associé sans créer de doublon', async () => {
      const existingUser = await db.user.create({
        data: { email: GOOGLE_USER.email, displayName: 'Ancien Compte' },
      });
      await db.account.create({
        data: {
          userId: existingUser.id,
          provider: 'GOOGLE',
          providerAccountId: GOOGLE_USER.sub,
        },
      });

      const credentials = await beginOAuth('google');
      const callback = await completeOAuth('google', credentials);

      expect(callback.statusCode).toBe(302);
      expect(callback.headers.location).toBe('http://localhost:5173/?oauth=success');

      expect(await db.user.count()).toBe(1);
      expect(await db.account.count()).toBe(1);
    });

    it('exige la confirmation du mot de passe si un compte email existe déjà', async () => {
      await db.user.create({
        data: {
          email: GOOGLE_USER.email,
          passwordHash: await hashPassword(PASSWORD),
        },
      });

      const credentials = await beginOAuth('google');
      const callback = await completeOAuth('google', credentials);

      expect(callback.statusCode).toBe(302);
      const location = new URL(callback.headers.location as string);
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.get('oauth')).toBe('link_required');
      expect(location.searchParams.get('provider')).toBe('google');
      const linkToken = location.searchParams.get('linkToken');
      expect(linkToken).toBeTruthy();

      // Aucune session ni compte ne doit être créé tant que le mot de passe n'est pas confirmé.
      expect(callback.cookies.find((c) => c.name === 'session_id')).toBeUndefined();
      expect(await db.account.count()).toBe(0);

      // Mot de passe incorrect : liaison refusée.
      const wrongPassword = await app.inject({
        method: 'POST',
        url: '/api/auth/oauth/link-confirm',
        payload: { linkToken, password: 'MauvaisMotDePasse123!' },
      });
      expect(wrongPassword.statusCode).toBe(401);
      expect(await db.account.count()).toBe(0);

      // Mot de passe correct : liaison et session créées.
      const confirmed = await app.inject({
        method: 'POST',
        url: '/api/auth/oauth/link-confirm',
        payload: { linkToken, password: PASSWORD },
      });
      expect(confirmed.statusCode).toBe(200);
      expect(confirmed.cookies.find((c) => c.name === 'session_id')).toBeDefined();

      const account = await db.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'GOOGLE',
            providerAccountId: GOOGLE_USER.sub,
          },
        },
      });
      expect(account).not.toBeNull();
    });

    it("rejette un state invalide ou absent avec un statut 400", async () => {
      const credentials = await beginOAuth('google');
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/oauth/google/callback?code=test-code&state=state-falsifie',
        cookies: {
          oauth_state: credentials.state,
          oauth_code_verifier: credentials.codeVerifier,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('crée le compte via ORCID lors du premier callback', async () => {
      const credentials = await beginOAuth('orcid');
      const callback = await completeOAuth('orcid', credentials);

      expect(callback.statusCode).toBe(302);
      expect(callback.headers.location).toBe('http://localhost:5173/?oauth=success');

      const user = await db.user.findUnique({ where: { email: ORCID_USER.email } });
      expect(user).not.toBeNull();

      const account = await db.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'ORCID',
            providerAccountId: ORCID_USER.sub,
          },
        },
      });
      expect(account).not.toBeNull();
    });
  });

  describe('POST /api/auth/oauth/link-confirm', () => {
    it('rejette un jeton de liaison invalide avec un statut 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/oauth/link-confirm',
        payload: { linkToken: 'jeton.invalide', password: PASSWORD },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
