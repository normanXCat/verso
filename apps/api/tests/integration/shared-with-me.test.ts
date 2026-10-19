import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

describe("Tests d'intégration : Œuvres partagées (/api/collaborations/shared-with-me)", () => {
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
    await prisma.notification.deleteMany();
    await prisma.abuseReport.deleteMany();
    await prisma.userBlock.deleteMany();
    await prisma.songCredit.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.collaborator.deleteMany();
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

  async function registerUser(
    email: string,
    displayName?: string,
  ): Promise<{ userId: string; sessionId: string }> {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'Password123!', displayName },
    });
    const sessionId = response.cookies.find((c) => c.name === 'session_id')?.value;
    if (!sessionId) {
      throw new Error("Échec de l'obtention du cookie de session");
    }
    return { userId: response.json().user.id as string, sessionId };
  }

  function authCookie(sessionId: string): { session_id: string } {
    return { session_id: sessionId };
  }

  it('liste les morceaux partagés avec l’utilisateur et permet de filtrer par rôle', async () => {
    const authorA = await registerUser('author-a@verso.fr', 'Auteur A');
    const authorB = await registerUser('author-b@verso.fr', 'Auteur B');
    const collaborator = await registerUser('collab-shared@verso.fr', 'Collaborateur');

    // Auteur A crée 2 morceaux
    const songA1 = await prisma.song.create({
      data: { userId: authorA.userId, title: 'Morceau A1 Co-écrit' },
    });
    const songA2 = await prisma.song.create({
      data: { userId: authorA.userId, title: 'Morceau A2 Lecture Seule' },
    });

    // Auteur B crée 1 morceau
    const songB1 = await prisma.song.create({
      data: { userId: authorB.userId, title: 'Morceau B1 Co-écrit' },
    });

    // Collaborations pour le collaborateur
    await prisma.collaborator.create({
      data: {
        songId: songA1.id,
        userId: collaborator.userId,
        invitedById: authorA.userId,
        role: 'CO_AUTHOR',
        status: 'ACTIVE',
      },
    });

    await prisma.collaborator.create({
      data: {
        songId: songA2.id,
        userId: collaborator.userId,
        invitedById: authorA.userId,
        role: 'READER',
        status: 'ACTIVE',
      },
    });

    await prisma.collaborator.create({
      data: {
        songId: songB1.id,
        userId: collaborator.userId,
        invitedById: authorB.userId,
        role: 'CO_AUTHOR',
        status: 'ACTIVE',
      },
    });

    // 1. Consultation sans filtre (toutes les œuvres partagées)
    const allRes = await app.inject({
      method: 'GET',
      url: '/api/collaborations/shared-with-me',
      cookies: authCookie(collaborator.sessionId),
    });

    expect(allRes.statusCode).toBe(200);
    const allItems = allRes.json().items;
    expect(allItems).toHaveLength(3);

    // 2. Filtrage par rôle CO_AUTHOR
    const coAuthorRes = await app.inject({
      method: 'GET',
      url: '/api/collaborations/shared-with-me?role=CO_AUTHOR',
      cookies: authCookie(collaborator.sessionId),
    });

    expect(coAuthorRes.statusCode).toBe(200);
    const coAuthorItems = coAuthorRes.json().items;
    expect(coAuthorItems).toHaveLength(2);
    expect(coAuthorItems.every((item: { role: string }) => item.role === 'CO_AUTHOR')).toBe(true);

    // 3. Filtrage par propriétaire Auteur A
    const ownerFilterRes = await app.inject({
      method: 'GET',
      url: `/api/collaborations/shared-with-me?ownerId=${authorA.userId}`,
      cookies: authCookie(collaborator.sessionId),
    });

    expect(ownerFilterRes.statusCode).toBe(200);
    const ownerItems = ownerFilterRes.json().items;
    expect(ownerItems).toHaveLength(2);
    expect(
      ownerItems.every((item: { owner: { id: string } }) => item.owner.id === authorA.userId),
    ).toBe(true);
  });

  it('liste les albums partagés et ne divulgue pas les œuvres révoquées ou quittées', async () => {
    const owner = await registerUser('album-shared-owner@verso.fr', 'Producteur');
    const guest = await registerUser('album-shared-guest@verso.fr', 'Invité Album');

    // Création d'un album avec 2 morceaux
    const album = await prisma.album.create({
      data: { userId: owner.userId, title: 'Album Commun' },
    });
    await prisma.song.create({
      data: { userId: owner.userId, title: 'Piste 1', albumId: album.id },
    });
    await prisma.song.create({
      data: { userId: owner.userId, title: 'Piste 2', albumId: album.id },
    });

    // Morceau révoqué
    const revokedSong = await prisma.song.create({
      data: { userId: owner.userId, title: 'Morceau Révoqué' },
    });

    // Collaborations
    await prisma.collaborator.create({
      data: {
        albumId: album.id,
        userId: guest.userId,
        invitedById: owner.userId,
        role: 'CO_AUTHOR',
        status: 'ACTIVE',
      },
    });

    await prisma.collaborator.create({
      data: {
        songId: revokedSong.id,
        userId: guest.userId,
        invitedById: owner.userId,
        role: 'READER',
        status: 'REVOKED',
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/collaborations/shared-with-me',
      cookies: authCookie(guest.sessionId),
    });

    expect(res.statusCode).toBe(200);
    const items = res.json().items;
    // Seul l'album actif doit être renvoyé, le morceau révoqué est exclu
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('album');
    expect(items[0].title).toBe('Album Commun');
    expect(items[0].trackCount).toBe(2);
  });
});
