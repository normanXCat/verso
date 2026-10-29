import { escapeHtml } from './escape.js';
import { EMAIL_PALETTE } from './palette.js';
import { renderPreheader, renderLogo, renderBanner, renderFooter } from './components.js';

const P = EMAIL_PALETTE;

export interface EmailLayoutOptions {
  subject: string;
  preheader: string;
  clientUrl: string;
  assetsUrl: string;
  replyToEmail?: string;
  reason: string;
  showBanner?: boolean;
}

/**
 * Gabarit HTML racine pour tous les emails transactionnels de Verso.
 * Respecte les contraintes strictes d'HTML d'email : tableaux HTML, styles en ligne,
 * palette explicite sans variables CSS, compatible Outlook et dark-mode natif.
 */
export function renderEmailLayout(contentHtml: string, options: EmailLayoutOptions): string {
  const safeSubject = escapeHtml(options.subject);
  const preheaderHtml = renderPreheader(options.preheader);
  const logoHtml = renderLogo({ assetsUrl: options.assetsUrl, clientUrl: options.clientUrl });
  const bannerHtml = options.showBanner ? renderBanner({ assetsUrl: options.assetsUrl }) : '';
  const footerHtml = renderFooter({
    clientUrl: options.clientUrl,
    replyToEmail: options.replyToEmail,
    reason: options.reason,
  });

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr" xml:lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>${safeSubject}</title>

  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->

  <style type="text/css">
    /* Normalisation générale des clients mail */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    /* Adaptabilité mobile (< 620px) : colonne unique, boutons pleine largeur */
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .email-card-cell {
        padding: 24px 18px !important;
      }
      .email-outer-cell {
        padding: 12px 8px !important;
      }
      .btn-table {
        width: 100% !important;
      }
      .btn-cell-primary, .btn-cell-secondary {
        width: 100% !important;
        display: block !important;
      }
      .btn-link-primary, .btn-link-secondary {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 15px 16px !important;
      }
    }

    /* Repli thème clair pour les clients supportant prefers-color-scheme */
    @media (prefers-color-scheme: light) {
      .email-bg {
        background-color: ${P.light.background} !important;
      }
      .email-card {
        background-color: ${P.light.card} !important;
        border-color: ${P.light.border} !important;
      }
      .email-heading {
        color: ${P.light.text} !important;
      }
      .email-text {
        color: ${P.light.text} !important;
      }
      .email-text-secondary {
        color: ${P.light.textSecondary} !important;
      }
      .email-text-muted {
        color: ${P.light.textMuted} !important;
      }
      .infobox {
        background-color: ${P.light.cardInner} !important;
        border-color: ${P.light.border} !important;
      }
      .infobox-title {
        color: ${P.light.text} !important;
      }
      .code-box {
        background-color: ${P.light.codeBg} !important;
        border-color: ${P.light.borderSubtle} !important;
      }
      .code-link {
        color: ${P.light.accent} !important;
      }
      .btn-cell-primary {
        background-color: ${P.light.accent} !important;
      }
      .btn-link-primary {
        color: ${P.light.buttonText} !important;
      }
      .btn-cell-secondary {
        background-color: ${P.light.cardInner} !important;
        border-color: ${P.light.border} !important;
      }
      .btn-link-secondary {
        color: ${P.light.text} !important;
      }
      .divider {
        border-color: ${P.light.border} !important;
      }
      .email-footer {
        border-color: ${P.light.border} !important;
      }
      .banner-cell {
        border-color: ${P.light.border} !important;
      }
      .logo-dark {
        display: none !important;
      }
      .logo-light {
        display: block !important;
      }
    }
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; width: 100% !important; background-color: ${P.dark.background}; -webkit-font-smoothing: antialiased;">
  ${preheaderHtml}

  <!-- Tableau enveloppe externe -->
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" class="email-bg" style="background-color: ${P.dark.background}; min-width: 100%;">
    <tr>
      <td align="center" class="email-outer-cell" style="padding: 32px 16px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->

        <!-- Carte centrale 600px maximum -->
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" class="email-container email-card" style="max-width: 600px; background-color: ${P.dark.card}; border: 1px solid ${P.dark.border}; border-radius: 6px; border-collapse: separate; overflow: hidden;">
          <tr>
            <td class="email-card-cell" style="padding: 36px 36px 28px 36px;">
              ${logoHtml}
              ${bannerHtml}
              ${contentHtml}
              ${footerHtml}
            </td>
          </tr>
        </table>

        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
