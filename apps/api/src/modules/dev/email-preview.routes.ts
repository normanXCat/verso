import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';
import {
  generateEmail,
  getSampleEmailProps,
  type AnyEmailProps,
  type EmailType,
} from '../../emails/index.js';

const AVAILABLE_EMAILS: Array<{ id: EmailType; name: string; description: string }> = [
  {
    id: 'verification',
    name: 'Vérification d’adresse email',
    description: 'Envoyé à l’inscription ou lors d’une demande de renvoi.',
  },
  {
    id: 'welcome',
    name: 'Bienvenue après vérification',
    description: 'Envoyé dès que l’adresse email est confirmée avec succès.',
  },
  {
    id: 'forgot-password',
    name: 'Mot de passe oublié',
    description: 'Lien temporaire à usage unique pour choisir un nouveau mot de passe.',
  },
  {
    id: 'password-changed',
    name: 'Confirmation de modification du mot de passe',
    description: 'Alerte de sécurité avec détails et lien « Ce n’était pas moi ».',
  },
  {
    id: 'collaboration-invite',
    name: 'Invitation de collaboration',
    description: 'Invitation sur un texte ou album avec rôle et boutons d’action.',
  },
  {
    id: 'activity-notification',
    name: 'Résumé d’activité / Notifications',
    description: 'Notifications collaboratives groupées (mentions, commentaires).',
  },
];

export const emailPreviewRoutes: FastifyPluginAsync = async (app) => {
  // STRICTEMENT INTERDIT EN PRODUCTION
  if (env.NODE_ENV === 'production') {
    return;
  }

  // Rendu brut d'un email pour iframe (HTML ou texte)
  app.get('/dev/emails/render', async (request, reply) => {
    const query = request.query as {
      type?: EmailType;
      mode?: 'dark' | 'light';
      format?: 'html' | 'text';
    };

    const type = query.type || 'verification';
    const mode = query.mode || 'dark';
    const format = query.format || 'html';

    const props = getSampleEmailProps(type, env.CLIENT_URL);
    const email = generateEmail(type, props as AnyEmailProps);

    if (format === 'text') {
      reply.type('text/plain; charset=utf-8');
      return email.text;
    }

    let html = email.html;
    // Si mode clair demandé dans l'iframe, injecter une classe ou forcer la palette claire
    if (mode === 'light') {
      html = html.replace(
        '<body class="email-bg"',
        '<body class="email-bg light-preview-override" style="margin: 0; padding: 0; width: 100% !important; background-color: #F4EFE6 !important;"',
      );
      // Forcer le sélecteur .light-preview-override
      const lightStyles = `
        <style>
          .light-preview-override { background-color: #F4EFE6 !important; }
          .light-preview-override .email-bg { background-color: #F4EFE6 !important; }
          .light-preview-override .email-card { background-color: #FFFFFF !important; border-color: #DDD5C6 !important; }
          .light-preview-override .email-heading { color: #14110F !important; }
          .light-preview-override .email-text { color: #14110F !important; }
          .light-preview-override .email-text-secondary { color: #666158 !important; }
          .light-preview-override .email-text-muted { color: #8C8578 !important; }
          .light-preview-override .infobox { background-color: #FAF7F2 !important; border-color: #DDD5C6 !important; }
          .light-preview-override .infobox-title { color: #14110F !important; }
          .light-preview-override .code-box { background-color: #F0EAE0 !important; border-color: #EAE4D8 !important; }
          .light-preview-override .code-link { color: #D9421C !important; }
          .light-preview-override .btn-cell-primary { background-color: #D9421C !important; }
          .light-preview-override .btn-link-primary { color: #FFFFFF !important; }
          .light-preview-override .btn-cell-secondary { background-color: #FAF7F2 !important; border-color: #DDD5C6 !important; }
          .light-preview-override .btn-link-secondary { color: #14110F !important; }
          .light-preview-override .divider { border-color: #DDD5C6 !important; }
          .light-preview-override .email-footer { border-color: #DDD5C6 !important; }
          .light-preview-override .banner-cell { border-color: #DDD5C6 !important; }
          .light-preview-override .logo-dark { display: none !important; }
          .light-preview-override .logo-light { display: block !important; }
        </style>
      `;
      html = html.replace('</head>', `${lightStyles}</head>`);
    }

    reply.type('text/html; charset=utf-8');
    return html;
  });

  // Interface d'atelier de prévisualisation
  app.get('/dev/emails', async (request, reply) => {
    const query = request.query as {
      type?: EmailType;
      mode?: 'dark' | 'light';
      width?: '600' | '375' | 'full';
      view?: 'preview' | 'html' | 'text';
    };

    const currentType: EmailType = query.type || 'verification';
    const currentMode = query.mode || 'dark';
    const currentWidth = query.width || '600';
    const currentView = query.view || 'preview';

    const props = getSampleEmailProps(currentType, env.CLIENT_URL);
    const email = generateEmail(currentType, props as AnyEmailProps);

    const iframeSrc = `/dev/emails/render?type=${encodeURIComponent(currentType)}&mode=${currentMode}&format=${currentView === 'text' ? 'text' : 'html'}`;

    const iframeWidthPx =
      currentWidth === '375' ? '375px' : currentWidth === '600' ? '600px' : '100%';

    const navLinksHtml = AVAILABLE_EMAILS.map((item) => {
      const active = item.id === currentType;
      const border = active
        ? 'border-left: 3px solid #FF5A2E; background: #1B1814;'
        : 'border-left: 3px solid transparent;';
      const color = active ? '#EDE6D8' : '#9A9183';
      return `
        <a href="/dev/emails?type=${item.id}&mode=${currentMode}&width=${currentWidth}&view=${currentView}"
           style="display: block; padding: 10px 14px; text-decoration: none; color: ${color}; font-size: 13px; line-height: 1.4; ${border} transition: all 120ms ease;">
          <div style="font-weight: ${active ? '600' : '400'}; color: ${active ? '#EDE6D8' : '#EDE6D8'};">${item.name}</div>
          <div style="font-size: 11px; color: #7A7266; margin-top: 2px;">${item.description}</div>
        </a>
      `;
    }).join('');

    const dashboardHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prévisualisation des Emails · Verso Atelier</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0E0D0B;
      color: #EDE6D8;
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    aside {
      width: 310px;
      background: #14110F;
      border-right: 1px solid #2A2621;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .aside-header {
      padding: 18px 16px;
      border-bottom: 1px solid #2A2621;
    }
    .aside-header h1 {
      font-family: Georgia, serif;
      font-size: 18px;
      font-weight: normal;
      color: #EDE6D8;
      letter-spacing: -0.01em;
    }
    .aside-header p {
      font-size: 12px;
      color: #9A9183;
      margin-top: 4px;
    }
    .email-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px 0;
    }
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: #0E0D0B;
    }
    header.toolbar {
      padding: 12px 20px;
      background: #171512;
      border-bottom: 1px solid #2A2621;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .tool-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tool-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #7A7266;
      margin-right: 4px;
    }
    .btn-toggle {
      background: #1E1A16;
      border: 1px solid #2A2621;
      color: #9A9183;
      padding: 5px 10px;
      font-size: 12px;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      transition: all 120ms ease;
    }
    .btn-toggle.active {
      background: #FF5A2E;
      color: #14110F;
      border-color: #FF5A2E;
      font-weight: 600;
    }
    .preview-viewport {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: auto;
      background: ${currentMode === 'light' ? '#E9E2D5' : '#070605'};
    }
    .iframe-wrapper {
      width: ${iframeWidthPx};
      max-width: 100%;
      height: 94%;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
      border: 1px solid #2A2621;
      background: ${currentMode === 'light' ? '#F4EFE6' : '#0E0D0B'};
      transition: width 200ms ease;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
    .code-view {
      width: ${iframeWidthPx};
      max-width: 100%;
      height: 94%;
      background: #12100E;
      color: #EDE6D8;
      border: 1px solid #2A2621;
      border-radius: 6px;
      padding: 18px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      line-height: 1.5;
      overflow: auto;
      white-space: pre-wrap;
    }
    .subject-bar {
      padding: 8px 20px;
      background: #14110F;
      border-bottom: 1px solid #23201B;
      font-size: 12px;
      color: #9A9183;
      display: flex;
      gap: 12px;
    }
    .subject-bar strong {
      color: #EDE6D8;
    }
  </style>
</head>
<body>
  <aside>
    <div class="aside-header">
      <h1>Verso · Emails</h1>
      <p>Atelier de prévisualisation transactionnelle</p>
    </div>
    <div class="email-list">
      ${navLinksHtml}
    </div>
  </aside>

  <main>
    <header class="toolbar">
      <div class="tool-group">
        <span class="tool-label">Mode :</span>
        <a href="/dev/emails?type=${currentType}&mode=dark&width=${currentWidth}&view=${currentView}"
           class="btn-toggle ${currentMode === 'dark' ? 'active' : ''}">Sombre</a>
        <a href="/dev/emails?type=${currentType}&mode=light&width=${currentWidth}&view=${currentView}"
           class="btn-toggle ${currentMode === 'light' ? 'active' : ''}">Clair</a>
      </div>

      <div class="tool-group">
        <span class="tool-label">Largeur :</span>
        <a href="/dev/emails?type=${currentType}&mode=${currentMode}&width=600&view=${currentView}"
           class="btn-toggle ${currentWidth === '600' ? 'active' : ''}">600 px (Desktop)</a>
        <a href="/dev/emails?type=${currentType}&mode=${currentMode}&width=375&view=${currentView}"
           class="btn-toggle ${currentWidth === '375' ? 'active' : ''}">375 px (Mobile)</a>
        <a href="/dev/emails?type=${currentType}&mode=${currentMode}&width=full&view=${currentView}"
           class="btn-toggle ${currentWidth === 'full' ? 'active' : ''}">100%</a>
      </div>

      <div class="tool-group">
        <span class="tool-label">Vue :</span>
        <a href="/dev/emails?type=${currentType}&mode=${currentMode}&width=${currentWidth}&view=preview"
           class="btn-toggle ${currentView === 'preview' ? 'active' : ''}">Rendu</a>
        <a href="/dev/emails?type=${currentType}&mode=${currentMode}&width=${currentWidth}&view=html"
           class="btn-toggle ${currentView === 'html' ? 'active' : ''}">HTML brut</a>
        <a href="/dev/emails?type=${currentType}&mode=${currentMode}&width=${currentWidth}&view=text"
           class="btn-toggle ${currentView === 'text' ? 'active' : ''}">Texte brut</a>
      </div>
    </header>

    <div class="subject-bar">
      <span>Objet : <strong>${email.subject}</strong></span>
    </div>

    <div class="preview-viewport">
      ${
        currentView === 'html'
          ? `<pre class="code-view">${email.html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
          : currentView === 'text'
            ? `<pre class="code-view">${email.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
            : `<div class="iframe-wrapper"><iframe src="${iframeSrc}" title="Aperçu email"></iframe></div>`
      }
    </div>
  </main>
</body>
</html>`;

    reply.type('text/html; charset=utf-8');
    return dashboardHtml;
  });
};
