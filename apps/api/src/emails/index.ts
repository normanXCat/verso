/**
 * Module central des emails transactionnels de Verso.
 * Gabarits HTML et texte brut, composants bulletproof Outlook,
 * palette "Encre & Papier" explicite et sécurité anti-injection.
 */

export * from './common/escape.js';
export * from './common/palette.js';
export * from './common/components.js';
export * from './common/layout.js';
export * from './common/text-layout.js';

export * from './templates/verification.js';
export * from './templates/welcome.js';
export * from './templates/forgot-password.js';
export * from './templates/password-changed.js';
export * from './templates/collaboration-invite.js';
export * from './templates/activity-notification.js';

import { buildVerificationEmail, type VerificationEmailProps } from './templates/verification.js';
import { buildWelcomeEmail, type WelcomeEmailProps } from './templates/welcome.js';
import {
  buildForgotPasswordEmail,
  type ForgotPasswordEmailProps,
} from './templates/forgot-password.js';
import {
  buildPasswordChangedEmail,
  type PasswordChangedEmailProps,
} from './templates/password-changed.js';
import {
  buildCollaborationInviteEmail,
  type CollaborationInviteEmailProps,
} from './templates/collaboration-invite.js';
import {
  buildActivityNotificationEmail,
  type ActivityNotificationEmailProps,
} from './templates/activity-notification.js';

export type EmailType =
  | 'verification'
  | 'welcome'
  | 'forgot-password'
  | 'password-changed'
  | 'collaboration-invite'
  | 'activity-notification';

export interface GeneratedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Données d'exemple complètes pour la prévisualisation et les tests de développement.
 */
export function getSampleEmailProps(type: EmailType, baseUrl = 'https://verso-lyrics.vercel.app') {
  const common = {
    clientUrl: baseUrl,
    assetsUrl: baseUrl,
    replyToEmail: 'contact@verso-lyrics.vercel.app',
    showBanner: true,
  };

  switch (type) {
    case 'verification':
      return {
        ...common,
        displayName: 'Akhenaton',
        rawToken: 'demo_token_verify_email_123456789',
      } satisfies VerificationEmailProps;

    case 'welcome':
      return {
        ...common,
        displayName: 'Oxmo Puccino',
      } satisfies WelcomeEmailProps;

    case 'forgot-password':
      return {
        ...common,
        displayName: 'Kery James',
        rawToken: 'demo_token_reset_password_abcdef123',
      } satisfies ForgotPasswordEmailProps;

    case 'password-changed':
      return {
        ...common,
        displayName: 'Youssoupha',
        changedAt: new Date(),
        deviceInfo: 'Firefox 125 sur Linux Ubuntu',
      } satisfies PasswordChangedEmailProps;

    case 'collaboration-invite':
      return {
        ...common,
        inviterName: 'Nekfeu',
        targetTitle: 'Ciel Noir',
        targetType: 'song' as const,
        role: 'COAUTHOR' as const,
        rawToken: 'demo_invite_token_fedcba987',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      } satisfies CollaborationInviteEmailProps;

    case 'activity-notification':
      return {
        ...common,
        displayName: 'Booba',
        items: [
          {
            type: 'COMMENT_ADDED',
            actorName: 'Médine',
            targetTitle: 'Grand Paris',
          },
          {
            type: 'MENTION',
            actorName: 'Dinos',
            targetTitle: 'Hiver 2026',
          },
          {
            type: 'COMMENT_REPLY',
            actorName: 'Médine',
            targetTitle: 'Grand Paris',
          },
        ],
      } satisfies ActivityNotificationEmailProps;
  }
}

export type AnyEmailProps =
  | VerificationEmailProps
  | WelcomeEmailProps
  | ForgotPasswordEmailProps
  | PasswordChangedEmailProps
  | CollaborationInviteEmailProps
  | ActivityNotificationEmailProps;

/**
 * Génère un email complet (sujet, HTML, texte) à partir de son type et de ses props.
 */
export function generateEmail(type: 'verification', props: VerificationEmailProps): GeneratedEmail;
export function generateEmail(type: 'welcome', props: WelcomeEmailProps): GeneratedEmail;
export function generateEmail(
  type: 'forgot-password',
  props: ForgotPasswordEmailProps,
): GeneratedEmail;
export function generateEmail(
  type: 'password-changed',
  props: PasswordChangedEmailProps,
): GeneratedEmail;
export function generateEmail(
  type: 'collaboration-invite',
  props: CollaborationInviteEmailProps,
): GeneratedEmail;
export function generateEmail(
  type: 'activity-notification',
  props: ActivityNotificationEmailProps,
): GeneratedEmail;
export function generateEmail(type: EmailType, props: AnyEmailProps): GeneratedEmail;
export function generateEmail(type: EmailType, props: AnyEmailProps): GeneratedEmail {
  switch (type) {
    case 'verification':
      return buildVerificationEmail(props as VerificationEmailProps);
    case 'welcome':
      return buildWelcomeEmail(props as WelcomeEmailProps);
    case 'forgot-password':
      return buildForgotPasswordEmail(props as ForgotPasswordEmailProps);
    case 'password-changed':
      return buildPasswordChangedEmail(props as PasswordChangedEmailProps);
    case 'collaboration-invite':
      return buildCollaborationInviteEmail(props as CollaborationInviteEmailProps);
    case 'activity-notification':
      return buildActivityNotificationEmail(props as ActivityNotificationEmailProps);
    default:
      throw new Error(`Type d'email inconnu : ${type}`);
  }
}
