import crypto from 'node:crypto';
import { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import { linkOAuthAccountSchema } from '@verso/shared';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { verifyPassword } from './password.service.js';
import { createSession, setSessionCookie } from './session.service.js';
import {
  OAuthError,
  createAuthorizationRequest,
  createLinkToken,
  exchangeCodeForTokens,
  fetchOAuthProfile,
  isOAuthProvider,
  isProviderConfigured,
  verifyLinkToken,
  type OAuthProvider,
} from './oauth.service.js';

const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_VERIFIER_COOKIE = 'oauth_code_verifier';
const OAUTH_COOKIE_MAX_AGE_SECONDS = 10 * 60;

function rateLimitFor(max: number): false | { max: number; timeWindow: string } {
  if (env.NODE_ENV === 'test') {
    return false;
  }
  return { max, timeWindow: '1 minute' };
}

/**
 * Compare deux chaînes en temps constant (protection contre les attaques temporelles sur le `state`).
 */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Construit une URL absolue de redirection vers le frontend.
 */
function clientRedirect(path: string, params?: Record<string, string>): string {
  const url = new URL(path, env.CLIENT_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function toPrismaProvider(provider: OAuthProvider): 'GOOGLE' | 'ORCID' {
  return provider === 'google' ? 'GOOGLE' : 'ORCID';
}

function setOAuthCookies(reply: FastifyReply, state: string, codeVerifier: string): void {
  const options = {
    path: '/',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: OAUTH_COOKIE_MAX_AGE_SECONDS,
  };
  reply.setCookie(OAUTH_STATE_COOKIE, state, options);
  reply.setCookie(OAUTH_VERIFIER_COOKIE, codeVerifier, options);
}

function clearOAuthCookies(reply: FastifyReply): void {
  const options = {
    path: '/',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };
  reply.clearCookie(OAUTH_STATE_COOKIE, options);
  reply.clearCookie(OAUTH_VERIFIER_COOKIE, options);
}

export const oauthRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Initiation du flux OAuth
  app.get('/:provider', { config: { rateLimit: rateLimitFor(10) } }, async (request, reply) => {
    const { provider } = request.params as { provider: string };

    if (!isOAuthProvider(provider)) {
      return reply.status(400).send({ message: 'Fournisseur OAuth inconnu' });
    }

    if (!isProviderConfigured(provider)) {
      return reply
        .status(503)
        .send({ message: "Ce fournisseur d'authentification n'est pas configuré" });
    }

    const { url, state, codeVerifier } = createAuthorizationRequest(provider);
    setOAuthCookies(reply, state, codeVerifier);

    return reply.redirect(url);
  });

  // Retour du fournisseur OAuth
  app.get('/:provider/callback', async (request, reply) => {
    const { provider } = request.params as { provider: string };

    if (!isOAuthProvider(provider)) {
      return reply.status(400).send({ message: 'Fournisseur OAuth inconnu' });
    }

    const query = request.query as { code?: string; state?: string };
    const storedState = request.cookies[OAUTH_STATE_COOKIE];
    const codeVerifier = request.cookies[OAUTH_VERIFIER_COOKIE];

    if (
      !query.code ||
      !query.state ||
      !storedState ||
      !codeVerifier ||
      !safeEqual(query.state, storedState)
    ) {
      clearOAuthCookies(reply);
      return reply.status(400).send({ message: 'Requête OAuth invalide ou expirée' });
    }

    clearOAuthCookies(reply);

    try {
      const tokens = await exchangeCodeForTokens(provider, query.code, codeVerifier);
      const profile = await fetchOAuthProfile(provider, tokens);
      const prismaProvider = toPrismaProvider(provider);

      // Cas 1 : le compte OAuth est déjà associé à un utilisateur.
      const existingAccount = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: prismaProvider,
            providerAccountId: profile.providerAccountId,
          },
        },
      });

      if (existingAccount) {
        const session = await createSession({
          userId: existingAccount.userId,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
          rememberMe: true,
        });
        setSessionCookie(reply, session.id, true);
        return reply.redirect(clientRedirect('/', { oauth: 'success' }));
      }

      // Sans adresse email fournie par le fournisseur, impossible de créer ou de rapprocher un compte.
      if (!profile.email) {
        return reply.redirect(
          clientRedirect('/login', { oauth: 'error', reason: 'email_required', provider }),
        );
      }

      // Cas 3 : un compte email existe déjà, la liaison exige la confirmation du mot de passe.
      const existingUser = await prisma.user.findUnique({ where: { email: profile.email } });
      if (existingUser) {
        const linkToken = createLinkToken({
          provider,
          providerAccountId: profile.providerAccountId,
          email: profile.email,
        });
        return reply.redirect(
          clientRedirect('/login', { oauth: 'link_required', linkToken, provider }),
        );
      }

      // Cas 2 : création du compte et de la liaison OAuth.
      const user = await prisma.user.create({
        data: {
          email: profile.email,
          displayName: profile.displayName,
          emailVerified: new Date(),
        },
      });

      await prisma.account.create({
        data: {
          userId: user.id,
          provider: prismaProvider,
          providerAccountId: profile.providerAccountId,
        },
      });

      const session = await createSession({
        userId: user.id,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
        rememberMe: true,
      });
      setSessionCookie(reply, session.id, true);

      return reply.redirect(clientRedirect('/', { oauth: 'success' }));
    } catch (error) {
      const reason = error instanceof OAuthError ? error.code : 'unknown';
      request.log.error({ err: error }, 'Échec du flux OAuth');
      return reply.redirect(clientRedirect('/login', { oauth: 'error', reason, provider }));
    }
  });

  // Confirmation de la liaison du compte OAuth par mot de passe
  app.post('/link-confirm', { config: { rateLimit: rateLimitFor(5) } }, async (request, reply) => {
    const parseResult = linkOAuthAccountSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Données de liaison invalides' });
    }

    const payload = verifyLinkToken(parseResult.data.linkToken);
    if (!payload) {
      return reply.status(400).send({ message: 'Jeton de liaison invalide ou expiré' });
    }

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ message: 'Identifiants incorrects' });
    }

    const isValidPassword = await verifyPassword(user.passwordHash, parseResult.data.password);
    if (!isValidPassword) {
      return reply.status(401).send({ message: 'Identifiants incorrects' });
    }

    const prismaProvider = toPrismaProvider(payload.provider);
    const alreadyLinked = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: prismaProvider,
          providerAccountId: payload.providerAccountId,
        },
      },
    });

    if (!alreadyLinked) {
      await prisma.account.create({
        data: {
          userId: user.id,
          provider: prismaProvider,
          providerAccountId: payload.providerAccountId,
        },
      });
    }

    const session = await createSession({
      userId: user.id,
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
      rememberMe: true,
    });
    setSessionCookie(reply, session.id, true);

    return reply.status(200).send({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      },
    });
  });
};
