import { describe, it, expect } from 'vitest';
import {
  generateEmail,
  getSampleEmailProps,
  buildVerificationEmail,
  buildWelcomeEmail,
  buildPasswordChangedEmail,
  buildCollaborationInviteEmail,
  buildActivityNotificationEmail,
  type EmailType,
  type AnyEmailProps,
} from '../../src/emails/index.js';

const PROD_CLIENT_URL = 'https://verso-lyrics.vercel.app';
const PROD_ASSETS_URL = 'https://verso-lyrics.vercel.app';

const ALL_EMAIL_TYPES: EmailType[] = [
  'verification',
  'welcome',
  'forgot-password',
  'password-changed',
  'collaboration-invite',
  'activity-notification',
];

describe('Gabarits des emails transactionnels Verso (apps/api/src/emails)', () => {
  describe('Génération de base pour chaque gabarit', () => {
    it.each(ALL_EMAIL_TYPES)(
      'le gabarit « %s » génère un sujet, un HTML et un texte brut non vides',
      (type) => {
        const props = getSampleEmailProps(type, PROD_CLIENT_URL);
        const email = generateEmail(type, props as AnyEmailProps);

        expect(email.subject).toBeTruthy();
        expect(email.subject.length).toBeGreaterThan(5);

        expect(email.html).toBeTruthy();
        expect(email.html).toContain('<!DOCTYPE html');
        expect(email.html).toContain('</html>');

        expect(email.text).toBeTruthy();
        expect(email.text.length).toBeGreaterThan(20);
      },
    );
  });

  describe('Conformité des URLs et assets', () => {
    it('les liens utilisent CLIENT_URL et les images utilisent EMAIL_ASSETS_URL', () => {
      const email = buildVerificationEmail({
        displayName: 'Testeur',
        rawToken: 'token_123',
        clientUrl: PROD_CLIENT_URL,
        assetsUrl: PROD_ASSETS_URL,
        showBanner: true,
      });

      // Liens pointant vers CLIENT_URL
      expect(email.html).toContain(`${PROD_CLIENT_URL}/verify-email?token=token_123`);
      expect(email.text).toContain(`${PROD_CLIENT_URL}/verify-email?token=token_123`);

      // Assets pointant vers EMAIL_ASSETS_URL
      expect(email.html).toContain(`${PROD_ASSETS_URL}/email/logo-wordmark-dark.png`);
      expect(email.html).toContain(`${PROD_ASSETS_URL}/email/header-banner.jpg`);
    });

    it('aucun mot « localhost » n’apparaît dans les emails générés avec les URLs de production', () => {
      for (const type of ALL_EMAIL_TYPES) {
        const props = getSampleEmailProps(type, PROD_CLIENT_URL);
        const email = generateEmail(type, props as AnyEmailProps);

        expect(email.html.toLowerCase()).not.toContain('localhost');
        expect(email.text.toLowerCase()).not.toContain('localhost');
      }
    });

    it('toutes les balises <img possèdent les attributs alt, width et height requis', () => {
      for (const type of ALL_EMAIL_TYPES) {
        const props = getSampleEmailProps(type, PROD_CLIENT_URL);
        const email = generateEmail(type, props as AnyEmailProps);

        // Regex extrayant chaque balise <img ...>
        const imgTags = email.html.match(/<img[^>]+>/g) || [];
        expect(imgTags.length).toBeGreaterThan(0);

        for (const tag of imgTags) {
          expect(tag).toMatch(/alt="[^"]*"/);
          expect(tag).toMatch(/width="[0-9]+"/);
          expect(tag).toMatch(/height="[0-9]+"/);
          expect(tag).toMatch(/border="0"/);
        }
      }
    });
  });

  describe('Sécurité et protection anti-injection XSS', () => {
    const maliciousInput = '<script>alert("XSS")</script>';

    it('échappe rigoureusement le nom d’utilisateur dans l’email de vérification', () => {
      const email = buildVerificationEmail({
        displayName: maliciousInput,
        rawToken: 'token_secure',
        clientUrl: PROD_CLIENT_URL,
        assetsUrl: PROD_ASSETS_URL,
      });

      expect(email.html).not.toContain('<script>');
      expect(email.html).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('échappe rigoureusement les titres de textes et noms d’auteurs dans les invitations', () => {
      const email = buildCollaborationInviteEmail({
        inviterName: maliciousInput,
        targetTitle: '<img src=x onerror=alert(1)>',
        targetType: 'song',
        role: 'COAUTHOR',
        rawToken: 'token_collab',
        clientUrl: PROD_CLIENT_URL,
        assetsUrl: PROD_ASSETS_URL,
      });

      expect(email.html).not.toContain('<script>');
      expect(email.html).not.toContain('<img src=x');
      expect(email.html).toContain('&lt;script&gt;');
      expect(email.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('refuse les protocoles malicieux (javascript:, data:) dans les URLs générées', () => {
      const email = buildVerificationEmail({
        rawToken: 'tok',
        clientUrl: 'javascript:alert(1)',
        assetsUrl: PROD_ASSETS_URL,
      });

      expect(email.html).not.toContain('href="javascript:');
      expect(email.html).toContain('href="#"');
    });

    it('ne met jamais l’adresse email d’un tiers dans une invitation destinée à quelqu’un d’autre', () => {
      const email = buildCollaborationInviteEmail({
        inviterName: 'Booba',
        targetTitle: 'DKR',
        targetType: 'song',
        role: 'COAUTHOR',
        rawToken: 'secret_token',
        clientUrl: PROD_CLIENT_URL,
        assetsUrl: PROD_ASSETS_URL,
      });

      expect(email.html).not.toContain('@verso.fr');
      expect(email.html).not.toContain('mailto:');
      expect(email.text).not.toContain('@verso.fr');
    });
  });

  describe('Détails des gabarits spécifiques', () => {
    it('l’email de bienvenue inclut le lien vers l’espace personnel (/app) et les fonctionnalités réelles', () => {
      const email = buildWelcomeEmail({
        displayName: 'Auteur',
        clientUrl: PROD_CLIENT_URL,
        assetsUrl: PROD_ASSETS_URL,
      });

      expect(email.html).toContain(`${PROD_CLIENT_URL}/app`);
      expect(email.html).toContain('Pose ton premier texte');
      expect(email.html).toContain('Pose une instru');
      expect(email.html).toContain('Protège tes écrits');
    });

    it('l’email de mot de passe modifié inclut la date et l’action « Ce n’était pas moi »', () => {
      const email = buildPasswordChangedEmail({
        displayName: 'Auteur',
        changedAt: new Date('2026-10-21T18:00:00Z'),
        deviceInfo: 'MacBook Pro / Chrome 124',
        clientUrl: PROD_CLIENT_URL,
        assetsUrl: PROD_ASSETS_URL,
      });

      expect(email.html).toContain(`${PROD_CLIENT_URL}/forgot-password`);
      expect(email.html).toContain('Ce n’était pas moi');
      expect(email.html).toContain('MacBook Pro / Chrome 124');
    });

    it('l’email de résumé d’activité formate chaque type d’événement collaborative', () => {
      const email = buildActivityNotificationEmail({
        displayName: 'Auteur',
        items: [
          { type: 'COMMENT_ADDED', actorName: 'Ali', targetTitle: 'Temps Mort' },
          { type: 'MENTION', actorName: 'Booba', targetTitle: 'Temps Mort' },
        ],
        clientUrl: PROD_CLIENT_URL,
        assetsUrl: PROD_ASSETS_URL,
      });

      expect(email.html).toContain('Ali a laissé un nouveau commentaire sur « Temps Mort »');
      expect(email.html).toContain('Booba t’a mentionné dans une discussion sur « Temps Mort »');
      expect(email.text).toContain('Ali a laissé un nouveau commentaire sur « Temps Mort »');
    });
  });
});
