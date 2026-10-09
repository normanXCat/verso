import { prisma } from '../../config/prisma.js';
import { assertCan, NotFoundAccessError } from '../permissions/permissions.service.js';
import type { UpdateSongCreditsInput } from '@verso/shared';

function sanitizeName(text: string): string {
  const noScript = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  const stripped = noScript.replace(/<[^>]*>/g, '').trim();
  return stripped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const creditsService = {
  /**
   * Consulter les crédits d'un morceau
   */
  async getCredits(user: { id: string }, songId: string) {
    await assertCan(user, { type: 'song', id: songId }, 'read');

    const song = await prisma.song.findUnique({
      where: { id: songId },
      select: { id: true },
    });
    if (!song) {
      throw new NotFoundAccessError();
    }

    const credits = await prisma.songCredit.findMany({
      where: { songId },
      orderBy: { order: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const totalAuthorPercentage = credits
      .filter((c) => c.role === 'AUTHOR' && c.percentage !== null && c.percentage !== undefined)
      .reduce((sum, c) => sum + (c.percentage || 0), 0);

    return {
      credits: credits.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        percentage: c.percentage,
        order: c.order,
        user: c.user,
      })),
      totalAuthorPercentage: Math.round(totalAuthorPercentage * 100) / 100,
    };
  },

  /**
   * Mettre à jour l'intégralité des crédits d'un morceau
   */
  async setCredits(user: { id: string }, songId: string, input: UpdateSongCreditsInput) {
    await assertCan(user, { type: 'song', id: songId }, 'edit_credits');

    const song = await prisma.song.findUnique({
      where: { id: songId },
      select: { id: true },
    });
    if (!song) {
      throw new NotFoundAccessError();
    }

    // Remplacement atomique de l'ensemble des crédits
    const credits = await prisma.$transaction(async (tx) => {
      await tx.songCredit.deleteMany({
        where: { songId },
      });

      const createdList = [];
      for (let i = 0; i < input.credits.length; i++) {
        const item = input.credits[i];
        const created = await tx.songCredit.create({
          data: {
            songId,
            name: sanitizeName(item.name.trim()),
            role: item.role,
            percentage: item.percentage ?? null,
            order: item.order ?? i,
            userId: item.userId ?? null,
          },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        });
        createdList.push(created);
      }
      return createdList;
    });

    const totalAuthorPercentage = credits
      .filter((c) => c.role === 'AUTHOR' && c.percentage !== null && c.percentage !== undefined)
      .reduce((sum, c) => sum + (c.percentage || 0), 0);

    return {
      credits: credits.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        percentage: c.percentage,
        order: c.order,
        user: c.user,
      })),
      totalAuthorPercentage: Math.round(totalAuthorPercentage * 100) / 100,
    };
  },
};
