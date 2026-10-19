import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

describe("Tests d'intégration : Verrouillage optimiste, conflits 409 et attribution des versions (/api/songs)", () => {
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

  it('incrémente la révision et archive authorId lors d’une mise à jour valide', async () => {
    const owner = await registerUser('owner-rev@verso.fr', 'Ali');
    const coAuthor = await registerUser('coauthor-rev@verso.fr', 'Booba');

    const song = await prisma.song.create({
      data: {
        userId: owner.userId,
        title: 'Temps Mort',
        content: "Dans l'arène comme un gladiateur",
        revision: 1,
      },
    });

    await prisma.collaborator.create({
      data: {
        songId: song.id,
        userId: coAuthor.userId,
        invitedById: owner.userId,
        role: 'CO_AUTHOR',
        status: 'ACTIVE',
      },
    });

    // 1. Co-auteur envoie une mise à jour avec expectedRevision = 1
    const resUpdate = await app.inject({
      method: 'PATCH',
      url: `/api/songs/${song.id}`,
      cookies: authCookie(coAuthor.sessionId),
      payload: {
        content: "Dans l'arène comme un gladiateur, armé d'un micro",
        expectedRevision: 1,
        createVersion: true,
      },
    });

    expect(resUpdate.statusCode).toBe(200);
    const body = resUpdate.json();
    expect(body.revision).toBe(2);
    expect(body.content).toBe("Dans l'arène comme un gladiateur, armé d'un micro");

    // Vérifier l'archivage avec authorId du co-auteur
    const versions = await prisma.songVersion.findMany({
      where: { songId: song.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(versions.length).toBeGreaterThanOrEqual(1);
    expect(versions[0].authorId).toBe(coAuthor.userId);
    expect(versions[0].isConflict).toBe(false);
  });

  it('détecte un conflit 409 si expectedRevision est obsolète et archive sans écraser le texte courant', async () => {
    const owner = await registerUser('owner-conflict@verso.fr', 'Ali');
    const coAuthor = await registerUser('coauthor-conflict@verso.fr', 'Booba');

    const song = await prisma.song.create({
      data: {
        userId: owner.userId,
        title: 'Temps Mort',
        content: 'Version initiale',
        revision: 2, // Le morceau est déjà en révision 2
      },
    });

    await prisma.collaborator.create({
      data: {
        songId: song.id,
        userId: coAuthor.userId,
        invitedById: owner.userId,
        role: 'CO_AUTHOR',
        status: 'ACTIVE',
      },
    });

    // Booba tente de sauvegarder avec expectedRevision = 1 (obsolète)
    const resConflict = await app.inject({
      method: 'PATCH',
      url: `/api/songs/${song.id}`,
      cookies: authCookie(coAuthor.sessionId),
      payload: {
        content: 'Modification concurrente de Booba',
        expectedRevision: 1,
      },
    });

    expect(resConflict.statusCode).toBe(409);
    const conflictBody = resConflict.json();
    expect(conflictBody.message).toContain('Conflit');

    // Vérifier que le texte en base n'a pas été écrasé
    const freshSong = await prisma.song.findUnique({
      where: { id: song.id },
    });
    expect(freshSong?.content).toBe('Version initiale');
    expect(freshSong?.revision).toBe(2);

    // Vérifier qu'une SongVersion étiquetée isConflict: true a été créée
    const conflictVersions = await prisma.songVersion.findMany({
      where: { songId: song.id, isConflict: true },
    });
    expect(conflictVersions).toHaveLength(1);
    expect(conflictVersions[0].authorId).toBe(coAuthor.userId);
    expect(conflictVersions[0].content).toBe('Modification concurrente de Booba');
  });

  it('attribue nominativement l’auteur des versions et consigne l’auteur de la restauration', async () => {
    const owner = await registerUser('owner-hist@verso.fr', 'Ali');
    const coAuthor = await registerUser('coauthor-hist@verso.fr', 'Booba');

    const song = await prisma.song.create({
      data: {
        userId: owner.userId,
        title: 'Morceau Historique',
        content: 'Couplet 1 original',
        revision: 1,
      },
    });

    await prisma.collaborator.create({
      data: {
        songId: song.id,
        userId: coAuthor.userId,
        invitedById: owner.userId,
        role: 'CO_AUTHOR',
        status: 'ACTIVE',
      },
    });

    // 1. Version archivée créée
    const v1 = await prisma.songVersion.create({
      data: {
        songId: song.id,
        title: song.title,
        content: 'Couplet 1 original',
        authorId: owner.userId,
        isConflict: false,
      },
    });

    // 2. Co-auteur consulte l'historique
    const resVersions = await app.inject({
      method: 'GET',
      url: `/api/songs/${song.id}/versions`,
      cookies: authCookie(coAuthor.sessionId),
    });
    expect(resVersions.statusCode).toBe(200);
    const versionsList = resVersions.json();
    expect(versionsList.length).toBeGreaterThanOrEqual(1);
    expect(versionsList[0].author.displayName).toBe('Ali');

    // 3. Co-auteur restaure la version v1
    const resRestore = await app.inject({
      method: 'POST',
      url: `/api/songs/${song.id}/versions/${v1.id}/restore`,
      cookies: authCookie(coAuthor.sessionId),
    });
    expect(resRestore.statusCode).toBe(200);

    // Vérifier qu'une nouvelle version pré-restauration a consigné Booba comme auteur
    const versionsAfterRestore = await prisma.songVersion.findMany({
      where: { songId: song.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(versionsAfterRestore[0].authorId).toBe(coAuthor.userId);
  });
});
