import { escapeHtml, sanitizeUrl } from './escape.js';
import { EMAIL_PALETTE } from './palette.js';

const P = EMAIL_PALETTE;

/**
 * Génère le bloc de texte d'aperçu masqué (preheader) affiché dans la liste des emails
 * de la messagerie sans déborder dans le corps du message.
 */
export function renderPreheader(text: string): string {
  const safeText = escapeHtml(text);
  // Padding invisible pour empêcher les clients de messagerie de lire le début du corps
  const invisibleSpaces = '&zwnj;&nbsp;'.repeat(30);
  return `
    <!-- Preheader masqué -->
    <div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;font-family:sans-serif;">
      ${safeText}${invisibleSpaces}
    </div>
  `;
}

/**
 * En-tête avec logo vectoriel Verso (largeur d'affichage 160 px, image 2x de 320 px).
 */
export function renderLogo({
  assetsUrl,
  clientUrl,
}: {
  assetsUrl: string;
  clientUrl: string;
}): string {
  const safeClientUrl = sanitizeUrl(clientUrl);
  const darkLogoUrl = `${assetsUrl.replace(/\/$/, '')}/email/logo-wordmark-dark.png`;
  const lightLogoUrl = `${assetsUrl.replace(/\/$/, '')}/email/logo-wordmark-light.png`;

  return `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td align="left" style="padding: 0;">
          <a href="${safeClientUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
            <!-- Logo sombre par défaut -->
            <img src="${darkLogoUrl}"
                 alt="Verso"
                 width="160"
                 height="59"
                 border="0"
                 class="logo-dark"
                 style="display: block; width: 160px; height: 59px; border: 0; outline: none; text-decoration: none;" />
            <!-- Logo clair pour les clients compatibles prefers-color-scheme -->
            <!--[if !mso]><!-->
            <img src="${lightLogoUrl}"
                 alt="Verso"
                 width="160"
                 height="59"
                 border="0"
                 class="logo-light"
                 style="display: none; width: 160px; height: 59px; border: 0; outline: none; text-decoration: none;" />
            <!--<![endif]-->
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Bandeau d'en-tête photographique fin (600 x 160 px, argentique Encre & Papier).
 */
export function renderBanner({ assetsUrl }: { assetsUrl: string }): string {
  const bannerUrl = `${assetsUrl.replace(/\/$/, '')}/email/header-banner.jpg`;
  return `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin-bottom: 28px; border-collapse: collapse;">
      <tr>
        <td style="padding: 0; line-height: 0; border-radius: 4px; overflow: hidden; border: 1px solid ${P.dark.border};" class="banner-cell">
          <img src="${bannerUrl}"
               alt=""
               width="600"
               height="160"
               border="0"
               style="display: block; width: 100%; max-width: 600px; height: auto; border: 0; outline: none;" />
        </td>
      </tr>
    </table>
  `;
}

/**
 * Titre d'email en Georgia (repli serif élégant, esprit atelier d'écriture).
 */
export function renderHeading(text: string): string {
  return `
    <h1 class="email-heading" style="margin: 0 0 18px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: normal; line-height: 1.3; color: ${P.dark.text}; letter-spacing: -0.01em;">
      ${escapeHtml(text)}
    </h1>
  `;
}

/**
 * Paragraphe de texte courant en police système sans-serif sobre.
 */
export function renderParagraph(
  text: string,
  options?: {
    secondary?: boolean;
    small?: boolean;
    style?: string;
  },
): string {
  const color = options?.secondary ? P.dark.textSecondary : P.dark.text;
  const fontSize = options?.small ? '13px' : '15px';
  const customStyle = options?.style ? ` ${options.style}` : '';
  const className = options?.secondary ? 'email-text-secondary' : 'email-text';

  return `
    <p class="${className}" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: ${fontSize}; line-height: 1.6; color: ${color};${customStyle}">
      ${escapeHtml(text)}
    </p>
  `;
}

/**
 * Bouton d'action principal ou secondaire "Bulletproof" compatible Outlook et mobile.
 * Conçu avec une cellule de tableau et un fond explicite avec contraste AA garanti.
 */
export function renderBulletproofButton({
  text,
  url,
  variant = 'primary',
}: {
  text: string;
  url: string;
  variant?: 'primary' | 'secondary';
}): string {
  const safeUrl = sanitizeUrl(url);
  const safeText = escapeHtml(text);

  if (variant === 'secondary') {
    return `
      <table border="0" cellpadding="0" cellspacing="0" role="presentation" class="btn-table" style="margin: 24px 0 20px 0; border-collapse: separate;">
        <tr>
          <td align="center" class="btn-cell-secondary" style="border-radius: 4px; border: 1px solid ${P.dark.border}; background-color: ${P.dark.cardInner}; text-align: center;">
            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn-link-secondary" style="display: inline-block; padding: 13px 26px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: ${P.dark.text}; text-decoration: none; border-radius: 4px; line-height: 1.2; text-align: center;">
              ${safeText}
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" class="btn-table" style="margin: 26px 0 22px 0; border-collapse: separate;">
      <tr>
        <td align="center" bgcolor="${P.dark.accent}" class="btn-cell-primary" style="border-radius: 4px; background-color: ${P.dark.accent}; text-align: center;">
          <!-- Bouton bulletproof Outlook : cellule de tableau + lien plein cadre -->
          <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn-link-primary" style="display: inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: ${P.dark.buttonText}; text-decoration: none; border-radius: 4px; line-height: 1.2; text-align: center;">
            ${safeText}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Bloc d'information / guide encadré sobre.
 */
export function renderInfoBox(
  contentHtml: string,
  options?: {
    title?: string;
  },
): string {
  const titleHtml = options?.title
    ? `<div class="infobox-title" style="font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-weight: normal; color: ${P.dark.text}; margin-bottom: 12px; letter-spacing: 0.02em;">${escapeHtml(options.title)}</div>`
    : '';

  return `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" class="infobox" style="margin: 22px 0; border: 1px solid ${P.dark.border}; background-color: ${P.dark.cardInner}; border-radius: 4px; border-collapse: separate;">
      <tr>
        <td style="padding: 18px 20px;">
          ${titleHtml}
          ${contentHtml}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Liste d'éléments clés ou fonctionnalités (3 points maximum, sobre et concis).
 */
export function renderFeatureList(items: Array<{ title: string; desc: string }>): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td valign="top" style="padding: 4px 10px 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: ${P.dark.accent}; line-height: 1.5; font-weight: bold; width: 14px;">
          •
        </td>
        <td valign="top" style="padding: 4px 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: ${P.dark.textSecondary};" class="email-text-secondary">
          <strong style="color: ${P.dark.text}; font-weight: 500;" class="email-text">${escapeHtml(item.title)}</strong> : ${escapeHtml(item.desc)}
        </td>
      </tr>
    `,
    )
    .join('');

  return `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: collapse;">
      ${rows}
    </table>
  `;
}

/**
 * Lien de secours en police monospace système avec instruction d'expiration.
 */
export function renderFallbackLink(url: string, note?: string): string {
  const safeUrl = sanitizeUrl(url);
  const noteHtml = note
    ? `<div class="email-text-muted" style="margin-top: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: ${P.dark.textMuted}; line-height: 1.4;">${escapeHtml(note)}</div>`
    : '';

  return `
    <div style="margin: 18px 0;">
      <div class="email-text-secondary" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: ${P.dark.textSecondary}; margin-bottom: 6px;">
        Si le bouton ne fonctionne pas, copie et colle cette adresse dans ton navigateur :
      </div>
      <div class="code-box" style="padding: 10px 12px; background-color: ${P.dark.codeBg}; border: 1px solid ${P.dark.borderSubtle}; border-radius: 4px; word-break: break-all;">
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="code-link" style="font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 12px; color: ${P.dark.accent}; text-decoration: none; word-break: break-all;">
          ${escapeHtml(url)}
        </a>
      </div>
      ${noteHtml}
    </div>
  `;
}

/**
 * Séparateur horizontal fin.
 */
export function renderDivider(): string {
  return `
    <hr class="divider" style="border: 0; border-top: 1px solid ${P.dark.border}; margin: 26px 0;" />
  `;
}

/**
 * Bloc de sécurité ou avertissement discret.
 */
export function renderSecurityNote(text: string): string {
  return `
    <p class="email-text-muted" style="margin: 18px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: ${P.dark.textMuted};">
      ${escapeHtml(text)}
    </p>
  `;
}

/**
 * Pied de page éditorial avec mention légale / transactionnelle, lien du site et contact.
 */
export function renderFooter({
  clientUrl,
  replyToEmail,
  reason,
}: {
  clientUrl: string;
  replyToEmail?: string;
  reason: string;
}): string {
  const safeClientUrl = sanitizeUrl(clientUrl);
  const contactText = replyToEmail
    ? ` · Répondre directement à ce message pour contacter l'équipe`
    : '';

  return `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" class="email-footer" style="margin-top: 32px; border-top: 1px solid ${P.dark.border}; padding-top: 24px;">
      <tr>
        <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: ${P.dark.textMuted}; text-align: left;" class="email-text-muted">
          <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 14px; color: ${P.dark.textSecondary}; margin-bottom: 6px;" class="email-text-secondary">
            Verso · Atelier d'écriture pour auteurs de rap
          </div>
          <div style="margin-bottom: 8px;">
            <a href="${safeClientUrl}" target="_blank" rel="noopener noreferrer" style="color: ${P.dark.textSecondary}; text-decoration: underline;" class="email-text-secondary">
              verso-lyrics.vercel.app
            </a>
            ${contactText}
          </div>
          <div>
            ${escapeHtml(reason)}
          </div>
        </td>
      </tr>
    </table>
  `;
}
