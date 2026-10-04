import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

describe("Tests d'intégration : export PDF horodaté (/api/songs/:id/export/pdf)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.songTag.deleteMany();
    await prisma.songVersion.deleteMany();
    await prisma.shareLink.deleteMany();
    await prisma.voiceNote.deleteMany();
    await prisma.instrumental.deleteMany();
    await prisma.song.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.album.deleteMany();
    await prisma.session.deleteMany();
    await prisma.emailToken.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  });

  async function registerUser(email: string, displayName?: string): Promise<{ sessionId: string }> {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'Password123!', displayName },
    });
    const sessionId = response.cookies.find((c) => c.name === 'session_id')?.value;
    if (!sessionId) {
      throw new Error("Échec de l'obtention du cookie de session");
    }
    return { sessionId };
  }

  function authCookie(sessionId: string): { session_id: string } {
    return { session_id: sessionId };
  }

  async function createSong(sessionId: string, title: string, content: string) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/songs',
      cookies: authCookie(sessionId),
      payload: { title, content },
    });
    return response.json();
  }

  it('produit un flux PDF avec horodatage et nom de fichier', async () => {
    const { sessionId } = await registerUser('pdf-export@verso.fr', 'MC Plume');
    const song = await createSong(
      sessionId,
      'Session studio 01',
      'Dans le noir je pose les premiers accords',
    );

    const response = await app.inject({
      method: 'GET',
      url: `/api/songs/${song.id}/export/pdf`,
      cookies: authCookie(sessionId),
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.headers['content-disposition']).toContain('session-studio-01-verso-');
    expect(response.headers['content-disposition']).toMatch(/\.pdf"/);

    // Signature binaire d'un PDF valide.
    expect(response.rawPayload.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(response.rawPayload.length).toBeGreaterThan(500);
  });

  it('renvoie 404 pour le texte d’un autre utilisateur (cloisonnement)', async () => {
    const owner = await registerUser('pdf-owner@verso.fr');
    const intruder = await registerUser('pdf-intruder@verso.fr');
    const song = await createSong(owner.sessionId, 'Privé', 'secret');

    const response = await app.inject({
      method: 'GET',
      url: `/api/songs/${song.id}/export/pdf`,
      cookies: authCookie(intruder.sessionId),
    });

    expect(response.statusCode).toBe(404);
  });

  it('exige une session authentifiée', async () => {
    const { sessionId } = await registerUser('pdf-noauth@verso.fr');
    const song = await createSong(sessionId, 'Anonyme', 'contenu');

    const response = await app.inject({
      method: 'GET',
      url: `/api/songs/${song.id}/export/pdf`,
    });

    expect(response.statusCode).toBe(401);
  });
});
