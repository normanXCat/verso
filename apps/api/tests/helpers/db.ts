import { prisma } from '../../src/config/prisma.js';

/**
 * Nettoie toutes les tables de la base de données dans l'ordre strict des dépendances
 * de clés étrangères pour garantir des tests isolés et sans erreurs FK.
 */
export async function clearDatabase(): Promise<void> {
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
}
