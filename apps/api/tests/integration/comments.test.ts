import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

describe("Tests d'intégration : Commentaires (/api/songs/:id/comments & /api/comments/*)", () => {
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

  it('permet au propriétaire, co-auteur et commentateur de commenter mais rejette le lecteur avec un 404', async () => {
    const owner = await registerUser('owner-comment@verso.fr', 'Propriétaire');
    const coAuthor = await registerUser('coauthor-comment@verso.fr', 'Co-Auteur');
    const commenter = await registerUser('commenter-comment@verso.fr', 'Commentateur');
    const reader = await registerUser('reader-comment@verso.fr', 'Lecteur');
    const stranger = await registerUser('stranger-comment@verso.fr', 'Inconnu');

    const song = await prisma.song.create({
      data: {
        userId: owner.userId,
        title: 'Morceau Test Commentaires',
        content: 'Ligne 1\nLigne 2\nLigne 3\nLigne 4',
      },
    });

    await prisma.collaborator.createMany({
      data: [
        {
          songId: song.id,
          userId: coAuthor.userId,
          invitedById: owner.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
        {
          songId: song.id,
          userId: commenter.userId,
          invitedById: owner.userId,
          role: 'COMMENTER',
          status: 'ACTIVE',
        },
        {
          songId: song.id,
          userId: reader.userId,
          invitedById: owner.userId,
          role: 'READER',
          status: 'ACTIVE',
        },
      ],
    });

    // 1. Commentateur crée un commentaire ancré
    const resCommenter = await app.inject({
      method: 'POST',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(commenter.sessionId),
      payload: {
        content: 'Très bonne rime ici',
        startLine: 1,
        endLine: 2,
      },
    });

    expect(resCommenter.statusCode).toBe(201);
    const commentBody = resCommenter.json();
    expect(commentBody.comment.content).toBe('Très bonne rime ici');
    expect(commentBody.comment.startLine).toBe(1);
    expect(commentBody.comment.endLine).toBe(2);
    expect(commentBody.comment.author.displayName).toBe('Commentateur');
    expect(commentBody.comment.isResolved).toBe(false);

    // 2. Co-auteur crée un commentaire
    const resCoAuthor = await app.inject({
      method: 'POST',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(coAuthor.sessionId),
      payload: {
        content: 'On devrait raccourcir ce vers',
        startLine: 3,
        endLine: 3,
      },
    });
    expect(resCoAuthor.statusCode).toBe(201);

    // 3. Propriétaire crée un commentaire
    const resOwner = await app.inject({
      method: 'POST',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(owner.sessionId),
      payload: {
        content: 'Remarque du proprio',
        startLine: 4,
        endLine: 4,
      },
    });
    expect(resOwner.statusCode).toBe(201);

    // 4. Lecteur essaie de commenter -> 404 neutre (zéro fuite)
    const resReader = await app.inject({
      method: 'POST',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(reader.sessionId),
      payload: {
        content: 'Je suis juste lecteur',
        startLine: 1,
        endLine: 1,
      },
    });
    expect(resReader.statusCode).toBe(404);
    expect(resReader.json().message).toBe('Ressource introuvable');

    // 5. Inconnu essaie de commenter -> 404 neutre
    const resStranger = await app.inject({
      method: 'POST',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(stranger.sessionId),
      payload: {
        content: 'Piratage',
        startLine: 1,
        endLine: 1,
      },
    });
    expect(resStranger.statusCode).toBe(404);
  });

  it('valide et assainit le contenu (XSS) et contrôle la cohérence des lignes', async () => {
    const owner = await registerUser('owner-xss@verso.fr', 'Propriétaire');
    const song = await prisma.song.create({
      data: {
        userId: owner.userId,
        title: 'Morceau Sécurité',
      },
    });

    // Échec : startLine > endLine
    const resInvalidLines = await app.inject({
      method: 'POST',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(owner.sessionId),
      payload: {
        content: 'Inversion de lignes',
        startLine: 5,
        endLine: 2,
      },
    });
    expect(resInvalidLines.statusCode).toBe(400);

    // Succès avec assainissement HTML anti-XSS
    const resXss = await app.inject({
      method: 'POST',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(owner.sessionId),
      payload: {
        content: 'Attention <script>alert("xss")</script> et <img src="x" onerror="evil()" />',
        startLine: 1,
        endLine: 1,
      },
    });
    expect(resXss.statusCode).toBe(201);
    const savedContent = resXss.json().comment.content;
    expect(savedContent).not.toContain('<script>');
    expect(savedContent).not.toContain('onerror=');
  });

  it('gère les réponses hiérarchiques et les notifications de réponse et de mention @', async () => {
    const owner = await registerUser('owner-thread@verso.fr', 'OwnerMc');
    const coAuthor = await registerUser('coauthor-thread@verso.fr', 'CollabMc');

    const song = await prisma.song.create({
      data: {
        userId: owner.userId,
        title: 'Morceau Threads',
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

    // 1. Co-auteur pose un commentaire mentionnant le owner
    const resComment = await app.inject({
      method: 'POST',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(coAuthor.sessionId),
      payload: {
        content: 'Check ça @OwnerMc sur la vibe',
        startLine: 2,
        endLine: 2,
      },
    });
    expect(resComment.statusCode).toBe(201);
    const commentId = resComment.json().comment.id;

    // Vérifier notification créée pour le propriétaire (MENTION ou COMMENT_ADDED)
    const notifications = await prisma.notification.findMany({
      where: { recipientId: owner.userId },
    });
    expect(notifications.length).toBeGreaterThanOrEqual(1);

    // 2. Owner répond au commentaire
    const resReply = await app.inject({
      method: 'POST',
      url: `/api/comments/${commentId}/replies`,
      cookies: authCookie(owner.sessionId),
      payload: {
        content: 'Validé @CollabMc, on garde cette tournure',
      },
    });
    expect(resReply.statusCode).toBe(201);
    const replyBody = resReply.json();
    expect(replyBody.reply.parentId).toBe(commentId);
    expect(replyBody.reply.author.displayName).toBe('OwnerMc');

    // Vérifier notification créée pour CoAuthor (REPLY_ADDED ou MENTION)
    const collabNotifications = await prisma.notification.findMany({
      where: { recipientId: coAuthor.userId },
    });
    expect(collabNotifications.length).toBeGreaterThanOrEqual(1);

    // 3. Récupération des commentaires avec le fil complet
    const resList = await app.inject({
      method: 'GET',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(owner.sessionId),
    });
    expect(resList.statusCode).toBe(200);
    const listBody = resList.json();
    expect(listBody.comments).toHaveLength(1);
    expect(listBody.comments[0].replies).toHaveLength(1);
    expect(listBody.comments[0].replies[0].content).toContain('Validé');
  });

  it('gère la résolution, la réouverture et la suppression selon les permissions', async () => {
    const owner = await registerUser('owner-resolve@verso.fr', 'OwnerResolve');
    const coAuthor = await registerUser('coauthor-resolve@verso.fr', 'CoAuthorResolve');
    const commenter = await registerUser('commenter-resolve@verso.fr', 'CommenterResolve');
    const otherUser = await registerUser('other-resolve@verso.fr', 'OtherUser');

    const song = await prisma.song.create({
      data: {
        userId: owner.userId,
        title: 'Morceau Résolution',
      },
    });

    await prisma.collaborator.createMany({
      data: [
        {
          songId: song.id,
          userId: coAuthor.userId,
          invitedById: owner.userId,
          role: 'CO_AUTHOR',
          status: 'ACTIVE',
        },
        {
          songId: song.id,
          userId: commenter.userId,
          invitedById: owner.userId,
          role: 'COMMENTER',
          status: 'ACTIVE',
        },
      ],
    });

    // Commentateur crée un commentaire
    const resComment = await app.inject({
      method: 'POST',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(commenter.sessionId),
      payload: {
        content: 'À corriger',
        startLine: 1,
        endLine: 1,
      },
    });
    const commentId = resComment.json().comment.id;

    // Utilisateur non autorisé tente de résoudre -> 404
    const resOtherResolve = await app.inject({
      method: 'PATCH',
      url: `/api/comments/${commentId}/resolve`,
      cookies: authCookie(otherUser.sessionId),
    });
    expect(resOtherResolve.statusCode).toBe(404);

    // Co-auteur résout le commentaire -> 200
    const resCoAuthorResolve = await app.inject({
      method: 'PATCH',
      url: `/api/comments/${commentId}/resolve`,
      cookies: authCookie(coAuthor.sessionId),
    });
    expect(resCoAuthorResolve.statusCode).toBe(200);
    expect(resCoAuthorResolve.json().comment.isResolved).toBe(true);
    expect(resCoAuthorResolve.json().comment.resolvedById).toBe(coAuthor.userId);

    // Vérifier filtre isResolved=false et isResolved=true
    const resOpenOnly = await app.inject({
      method: 'GET',
      url: `/api/songs/${song.id}/comments?isResolved=false`,
      cookies: authCookie(owner.sessionId),
    });
    expect(resOpenOnly.json().comments).toHaveLength(0);

    const resResolvedOnly = await app.inject({
      method: 'GET',
      url: `/api/songs/${song.id}/comments?isResolved=true`,
      cookies: authCookie(owner.sessionId),
    });
    expect(resResolvedOnly.json().comments).toHaveLength(1);

    // Co-auteur rouvre le commentaire -> 200
    const resReopen = await app.inject({
      method: 'PATCH',
      url: `/api/comments/${commentId}/reopen`,
      cookies: authCookie(coAuthor.sessionId),
    });
    expect(resReopen.statusCode).toBe(200);
    expect(resReopen.json().comment.isResolved).toBe(false);

    // Suppression : Commentateur supprime son propre commentaire -> 204
    const resDelete = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${commentId}`,
      cookies: authCookie(commenter.sessionId),
    });
    expect(resDelete.statusCode).toBe(204);

    // Vérifier suppression
    const resAfterDelete = await app.inject({
      method: 'GET',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(owner.sessionId),
    });
    expect(resAfterDelete.json().comments).toHaveLength(0);
  });

  it('anonymise les commentaires quand isAnonymized: true (FR-005a)', async () => {
    const owner = await registerUser('owner-anon@verso.fr', 'OwnerAnon');
    const leaver = await registerUser('leaver-anon@verso.fr', 'DepartedArtist');

    const song = await prisma.song.create({
      data: {
        userId: owner.userId,
        title: 'Morceau Anonymisation',
      },
    });

    await prisma.collaborator.create({
      data: {
        songId: song.id,
        userId: leaver.userId,
        invitedById: owner.userId,
        role: 'CO_AUTHOR',
        status: 'ACTIVE',
      },
    });

    // DepartedArtist commente
    const resComment = await app.inject({
      method: 'POST',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(leaver.sessionId),
      payload: {
        content: 'Mon commentaire avant de partir',
        startLine: 1,
        endLine: 1,
      },
    });
    expect(resComment.statusCode).toBe(201);

    // Leaver quitte le projet
    const resLeave = await app.inject({
      method: 'POST',
      url: `/api/collaborations/songs/${song.id}/leave`,
      cookies: authCookie(leaver.sessionId),
    });
    expect(resLeave.statusCode).toBe(200);

    // Le propriétaire consulte les commentaires : l'auteur doit être anonymisé
    const resList = await app.inject({
      method: 'GET',
      url: `/api/songs/${song.id}/comments`,
      cookies: authCookie(owner.sessionId),
    });
    expect(resList.statusCode).toBe(200);
    const comments = resList.json().comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].author.displayName).toBe('Ancien collaborateur');
    expect(comments[0].author.avatarUrl).toBeNull();
  });
});
