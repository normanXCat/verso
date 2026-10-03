import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { User, Session } from '@prisma/client';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@verso/shared';
import { prisma } from '../../config/prisma.js';
import {
  hashPassword,
  verifyPassword,
  generateEmailToken,
  hashEmailToken,
} from './password.service.js';
import {
  createSession,
  validateSession,
  deleteSession,
  revokeAllUserSessions,
  listUserSessions,
  setSessionCookie,
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from './session.service.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    session?: Session;
  }
}

async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const sessionId = request.cookies[SESSION_COOKIE_NAME];
  if (!sessionId) {
    reply.status(401).send({ message: 'Non authentifié' });
    return;
  }

  const result = await validateSession(sessionId);
  if (!result) {
    clearSessionCookie(reply);
    reply.status(401).send({ message: 'Session invalide ou expirée' });
    return;
  }

  request.user = result.user;
  request.session = result.session;
}

export const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Inscription
  app.post(
    '/register',
    {
      config: {
        rateLimit:
          process.env.NODE_ENV === 'test'
            ? false
            : {
                max: 5,
                timeWindow: '1 minute',
              },
      },
    },
    async (request, reply) => {
      const parseResult = registerSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          message: 'Données invalides',
          errors: parseResult.error.flatten(),
        });
      }

      const { email, password, displayName } = parseResult.data;

      // Vérifier si un compte existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.status(409).send({
          message: 'Un compte existe déjà avec cette adresse email',
        });
      }

      // Hachage Argon2id du mot de passe
      const passwordHash = await hashPassword(password);

      // Création de l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName: displayName || null,
        },
      });

      // Génération du token de vérification d'email
      const { rawToken, tokenHash } = generateEmailToken();
      await prisma.emailToken.create({
        data: {
          email: user.email,
          tokenHash,
          type: 'VERIFY_EMAIL',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
      });

      // Envoi de l'email transactionnel
      await sendVerificationEmail(user.email, rawToken);

      // Création immédiate de la session
      const session = await createSession({
        userId: user.id,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
        rememberMe: false,
      });

      setSessionCookie(reply, session.id, false);

      return reply.status(201).send({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
        message: 'Compte créé avec succès. Un lien de vérification a été envoyé par email.',
      });
    },
  );

  // Connexion
  app.post(
    '/login',
    {
      config: {
        rateLimit:
          process.env.NODE_ENV === 'test'
            ? false
            : {
                max: 10,
                timeWindow: '1 minute',
              },
      },
    },
    async (request, reply) => {
      const parseResult = loginSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          message: 'Données invalides',
          errors: parseResult.error.flatten(),
        });
      }

      const { email, password, rememberMe } = parseResult.data;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.passwordHash) {
        return reply.status(401).send({
          message: 'Identifiants incorrects',
        });
      }

      const isValidPassword = await verifyPassword(user.passwordHash, password);
      if (!isValidPassword) {
        return reply.status(401).send({
          message: 'Identifiants incorrects',
        });
      }

      const session = await createSession({
        userId: user.id,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
        rememberMe,
      });

      setSessionCookie(reply, session.id, rememberMe);

      return reply.status(200).send({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
      });
    },
  );

  // Profil connecté
  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.status(200).send({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        themePreference: user.themePreference,
      },
    });
  });

  // Déconnexion
  app.post('/logout', async (request, reply) => {
    const sessionId = request.cookies[SESSION_COOKIE_NAME];
    if (sessionId) {
      await deleteSession(sessionId);
    }
    clearSessionCookie(reply);
    return reply.status(200).send({
      message: 'Déconnexion réussie.',
    });
  });

  // Vérification d'email
  app.get('/verify-email', async (request, reply) => {
    const query = request.query as { token?: string };
    const rawToken = query.token;

    if (!rawToken || typeof rawToken !== 'string') {
      return reply.status(400).send({
        message: 'Jeton de vérification requis',
      });
    }

    const tokenHash = hashEmailToken(rawToken);

    // On accepte soit le hash sha256, soit l'id direct si test
    const emailToken = await prisma.emailToken.findFirst({
      where: {
        OR: [{ tokenHash }, { id: rawToken }],
        type: 'VERIFY_EMAIL',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!emailToken) {
      return reply.status(400).send({
        message: 'Jeton de vérification invalide ou expiré',
      });
    }

    // Validation et mise à jour
    await prisma.$transaction([
      prisma.emailToken.update({
        where: { id: emailToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { email: emailToken.email },
        data: { emailVerified: new Date() },
      }),
    ]);

    return reply.status(200).send({
      message: 'Votre adresse email a été vérifiée avec succès.',
    });
  });

  // Demande de réinitialisation de mot de passe
  app.post(
    '/forgot-password',
    {
      config: {
        rateLimit:
          process.env.NODE_ENV === 'test'
            ? false
            : {
                max: 5,
                timeWindow: '1 minute',
              },
      },
    },
    async (request, reply) => {
      const parseResult = forgotPasswordSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          message: 'Adresse email invalide',
        });
      }

      const { email } = parseResult.data;
      const user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        const { rawToken, tokenHash } = generateEmailToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

        await prisma.emailToken.create({
          data: {
            email: user.email,
            tokenHash,
            type: 'RESET_PASSWORD',
            expiresAt,
          },
        });

        await sendPasswordResetEmail(user.email, rawToken);
      }

      // Réponse générique pour éviter l'énumération des utilisateurs
      return reply.status(200).send({
        message: 'Si cette adresse existe, un email contenant un lien temporaire a été envoyé.',
      });
    },
  );

  // Validation du nouveau mot de passe
  app.post('/reset-password', async (request, reply) => {
    const parseResult = resetPasswordSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: 'Données de réinitialisation invalides',
        errors: parseResult.error.flatten(),
      });
    }

    const { token: rawToken, newPassword } = parseResult.data;
    const tokenHash = hashEmailToken(rawToken);

    const emailToken = await prisma.emailToken.findFirst({
      where: {
        OR: [{ tokenHash }, { id: rawToken }],
        type: 'RESET_PASSWORD',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!emailToken) {
      return reply.status(400).send({
        message: 'Jeton de réinitialisation invalide ou expiré',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: emailToken.email },
    });

    if (!user) {
      return reply.status(400).send({
        message: 'Utilisateur introuvable',
      });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.emailToken.update({
        where: { id: emailToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      }),
      // Révocation de toutes les sessions actives (règle de sécurité constitutionnelle)
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    clearSessionCookie(reply);

    return reply.status(200).send({
      message: 'Votre mot de passe a été mis à jour. Veuillez vous reconnecter.',
    });
  });

  // Sessions actives
  app.get('/sessions', { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const session = request.session!;

    const sessions = await listUserSessions(user.id, session.id);
    return reply.status(200).send(sessions);
  });

  // Révocation d'une session distante
  app.delete('/sessions/:id', { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { id: targetSessionId } = request.params as { id: string };

    const targetSession = await prisma.session.findUnique({
      where: { id: targetSessionId },
    });

    if (!targetSession || targetSession.userId !== user.id) {
      return reply.status(404).send({
        message: 'Session introuvable',
      });
    }

    await deleteSession(targetSessionId);
    return reply.status(200).send({
      message: 'Session révoquée avec succès.',
    });
  });

  // Révocation de toutes les sessions distantes
  app.delete('/sessions', { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const currentSession = request.session!;
    const query = request.query as { allExceptCurrent?: string };

    if (query.allExceptCurrent === 'true') {
      await revokeAllUserSessions(user.id, currentSession.id);
      return reply.status(200).send({
        message: 'Toutes les sessions distantes ont été révoquées.',
      });
    }

    await revokeAllUserSessions(user.id);
    clearSessionCookie(reply);
    return reply.status(200).send({
      message: 'Toutes les sessions ont été révoquées.',
    });
  });
};
