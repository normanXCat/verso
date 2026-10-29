import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

describe('Route de prévisualisation des emails (/dev/emails)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /dev/emails renvoie l’atelier de prévisualisation complet avec tous les gabarits', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/dev/emails?type=verification&mode=dark&width=600',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');

    const body = res.body;
    expect(body).toContain('Verso · Emails');
    expect(body).toContain('Vérification d’adresse email');
    expect(body).toContain('Bienvenue après vérification');
    expect(body).toContain('Mot de passe oublié');
    expect(body).toContain('Confirmation de modification du mot de passe');
    expect(body).toContain('Invitation de collaboration');
    expect(body).toContain('Résumé d’activité / Notifications');
    expect(body).toContain('600 px (Desktop)');
    expect(body).toContain('375 px (Mobile)');
  });

  it('GET /dev/emails/render (HTML) renvoie l’email prêt pour affichage', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/dev/emails/render?type=welcome&mode=dark&format=html',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('Ton carnet d’écriture est prêt');
    expect(res.body).toContain('C’est validé');
    expect(res.body).toContain('Ouvrir mon carnet');
  });

  it('GET /dev/emails/render (Mode clair) injecte les styles clairs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/dev/emails/render?type=verification&mode=light&format=html',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('light-preview-override');
    expect(res.body).toContain('background-color: #F4EFE6');
  });

  it('GET /dev/emails/render (Texte brut) renvoie le texte pur', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/dev/emails/render?type=forgot-password&format=text',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.body).toContain('Changer de mot de passe');
    expect(res.body).toContain('Lien de réinitialisation :');
  });
});
