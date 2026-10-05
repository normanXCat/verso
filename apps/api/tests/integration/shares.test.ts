import crypto from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

describe("Tests d'intégration : liens de partage privés (/api/songs/:id/share-links)", () => {
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

  async function createShareLink(
    sessionId: string,
    songId: string,
    payload: Record<string, unknown> = {},
  ) {
    return app.inject({
      method: 'POST',
      url: `/api/songs/${songId}/share-links`,
      cookies: authCookie(sessionId),
      payload,
    });
  }

  function tokenFromShareUrl(shareUrl: string): string {
    return shareUrl.split('/share/')[1] ?? '';
  }

  describe('POST /api/songs/:id/share-links', () => {
    it('crée un lien privé et renvoie l’URL complète une seule fois', async () => {
      const { sessionId } = await registerUser('share-create@verso.fr');
      const song = await createSong(sessionId, 'Nuit blanche', 'J’écris sous la lune');

      const response = await createShareLink(sessionId, song.id);

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(typeof body.shareUrl).toBe('string');
      expect(body.shareUrl).toContain('/share/sec_');
      expect(body.expiresAt).toBeNull();
      expect(body.isRevoked).toBe(false);
      expect(body.accessCount).toBe(0);
    });

    it('applique une expiration optionnelle en jours', async () => {
      const { sessionId } = await registerUser('share-expiry@verso.fr');
      const song = await createSong(sessionId, 'Éphémère', 'contenu');

      const response = await createShareLink(sessionId, song.id, { expiresInDays: 7 });

      expect(response.statusCode).toBe(201);
      const expiresAt = new Date(response.json().expiresAt).getTime();
      const expected = Date.now() + 7 * 24 * 60 * 60 * 1000;
      expect(Math.abs(expiresAt - expected)).toBeLessThan(60 * 1000);
    });

    it('ne stocke jamais le jeton brut en base (empreinte SHA-256 uniquement)', async () => {
      const { sessionId } = await registerUser('share-hash@verso.fr');
      const song = await createSong(sessionId, 'Secret', 'contenu');

      const response = await createShareLink(sessionId, song.id);
      const rawToken = tokenFromShareUrl(response.json().shareUrl);

      const stored = await prisma.shareLink.findFirst({ where: { songId: song.id } });
      expect(stored).not.toBeNull();
      expect(stored!.tokenHash).toBe(hashToken(rawToken));
      expect(stored!.tokenHash).not.toContain('sec_');
    });

    it('rejette une expiration invalide avec un statut 400', async () => {
      const { sessionId } = await registerUser('share-bad-expiry@verso.fr');
      const song = await createSong(sessionId, 'Invalide', 'contenu');

      const response = await createShareLink(sessionId, song.id, { expiresInDays: -3 });
      expect(response.statusCode).toBe(400);
    });

    it('renvoie 404 pour le texte d’un autre utilisateur (cloisonnement)', async () => {
      const owner = await registerUser('share-owner@verso.fr');
      const intruder = await registerUser('share-intruder@verso.fr');
      const song = await createSong(owner.sessionId, 'Privé', 'secret');

      const response = await createShareLink(intruder.sessionId, song.id);
      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/public/shares/:token', () => {
    it('expose le texte en lecture seule sans aucune donnée personnelle', async () => {
      const { sessionId } = await registerUser('share-public@verso.fr', 'MC Plume');
      const song = await createSong(sessionId, 'Nuit blanche', 'Vers inédit');
      const created = await createShareLink(sessionId, song.id);
      const token = tokenFromShareUrl(created.json().shareUrl);

      const response = await app.inject({
        method: 'GET',
        url: `/api/public/shares/${token}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toEqual({
        title: 'Nuit blanche',
        authorDisplayName: 'MC Plume',
        content: 'Vers inédit',
        status: 'DRAFT',
        updatedAt: expect.any(String),
      });
      // Zéro métadonnée personnelle
      expect(JSON.stringify(body)).not.toContain('@verso.fr');
      expect(body).not.toHaveProperty('email');
      expect(body).not.toHaveProperty('userId');
      expect(body).not.toHaveProperty('id');
    });

    it('incrémente le compteur d’accès à chaque consultation', async () => {
      const { sessionId } = await registerUser('share-count@verso.fr');
      const song = await createSong(sessionId, 'Compté', 'contenu');
      const created = await createShareLink(sessionId, song.id);
      const token = tokenFromShareUrl(created.json().shareUrl);

      await app.inject({ method: 'GET', url: `/api/public/shares/${token}` });
      await app.inject({ method: 'GET', url: `/api/public/shares/${token}` });

      const stored = await prisma.shareLink.findFirst({ where: { songId: song.id } });
      expect(stored!.accessCount).toBe(2);
      expect(stored!.lastAccessedAt).not.toBeNull();
    });

    it('renvoie 404 sans révéler le contenu pour un jeton inconnu', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/public/shares/sec_${'a'.repeat(43)}`,
      });
      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe("Ce lien n'est plus actif");
    });

    it('renvoie 404 pour un lien expiré', async () => {
      const { sessionId } = await registerUser('share-past@verso.fr');
      const song = await createSong(sessionId, 'Expiré', 'contenu');
      const rawToken = `sec_${'b'.repeat(43)}`;
      await prisma.shareLink.create({
        data: {
          songId: song.id,
          tokenHash: hashToken(rawToken),
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await app.inject({ method: 'GET', url: `/api/public/shares/${rawToken}` });
      expect(response.statusCode).toBe(404);
    });

    it('applique un rate limiting strict de 30 requêtes par minute', async () => {
      const { sessionId } = await registerUser('share-ratelimit@verso.fr');
      const song = await createSong(sessionId, 'Limité', 'contenu');
      const created = await createShareLink(sessionId, song.id);
      const token = tokenFromShareUrl(created.json().shareUrl);

      const response = await app.inject({
        method: 'GET',
        url: `/api/public/shares/${token}`,
      });
      expect(response.headers['x-ratelimit-limit']).toBe('30');
    });
  });

  describe('DELETE /api/songs/:id/share-links/:linkId', () => {
    it('révoque immédiatement le lien : toute consultation suivante échoue', async () => {
      const { sessionId } = await registerUser('share-revoke@verso.fr');
      const song = await createSong(sessionId, 'À révoquer', 'contenu');
      const created = await createShareLink(sessionId, song.id);
      const linkId = created.json().id;
      const token = tokenFromShareUrl(created.json().shareUrl);

      const revoke = await app.inject({
        method: 'DELETE',
        url: `/api/songs/${song.id}/share-links/${linkId}`,
        cookies: authCookie(sessionId),
      });
      expect(revoke.statusCode).toBe(204);

      const access = await app.inject({ method: 'GET', url: `/api/public/shares/${token}` });
      expect(access.statusCode).toBe(404);
      expect(access.json().message).toBe("Ce lien n'est plus actif");
    });

    it('interdit la révocation d’un lien appartenant à un autre utilisateur', async () => {
      const owner = await registerUser('share-revoke-owner@verso.fr');
      const intruder = await registerUser('share-revoke-intruder@verso.fr');
      const song = await createSong(owner.sessionId, 'Protégé', 'contenu');
      const created = await createShareLink(owner.sessionId, song.id);
      const linkId = created.json().id;
      const token = tokenFromShareUrl(created.json().shareUrl);

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/songs/${song.id}/share-links/${linkId}`,
        cookies: authCookie(intruder.sessionId),
      });
      expect(response.statusCode).toBe(404);

      // Le lien reste actif pour son propriétaire.
      const access = await app.inject({ method: 'GET', url: `/api/public/shares/${token}` });
      expect(access.statusCode).toBe(200);
    });
  });

  describe('GET /api/songs/:id/share-links', () => {
    it('liste les liens du texte sans rejouer le jeton brut', async () => {
      const { sessionId } = await registerUser('share-list@verso.fr');
      const song = await createSong(sessionId, 'Liste', 'contenu');
      await createShareLink(sessionId, song.id, { expiresInDays: 3 });
      await createShareLink(sessionId, song.id);

      const response = await app.inject({
        method: 'GET',
        url: `/api/songs/${song.id}/share-links`,
        cookies: authCookie(sessionId),
      });

      expect(response.statusCode).toBe(200);
      const links = response.json();
      expect(links).toHaveLength(2);
      expect(links[0]).not.toHaveProperty('shareUrl');
      expect(links[0]).toHaveProperty('accessCount');
    });
  });
});
