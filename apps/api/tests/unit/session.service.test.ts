import { describe, expect, it, beforeEach } from 'vitest';
import { prisma } from '../../src/config/prisma.js';
import {
  createSession,
  validateSession,
  deleteSession,
  revokeAllUserSessions,
  listUserSessions,
} from '../../src/modules/auth/session.service.js';

describe('Service de gestion des sessions (session.service)', () => {
  let userId: string;

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'session-unit-test@verso.fr',
      },
    });
    userId = user.id;
  });

  it('doit créer et valider une session active', async () => {
    const session = await createSession({
      userId,
      userAgent: 'Vitest Agent',
      ipAddress: '127.0.0.1',
      rememberMe: true,
    });

    expect(session.id).toBeDefined();
    expect(session.userId).toBe(userId);

    const validated = await validateSession(session.id);
    expect(validated).not.toBeNull();
    expect(validated?.user.id).toBe(userId);
  });

  it('doit supprimer une session lors de la déconnexion', async () => {
    const session = await createSession({ userId });
    await deleteSession(session.id);

    const validated = await validateSession(session.id);
    expect(validated).toBeNull();
  });

  it("doit révoquer toutes les sessions d'un utilisateur sauf la courante", async () => {
    const s1 = await createSession({ userId });
    const s2 = await createSession({ userId });
    const s3 = await createSession({ userId });

    await revokeAllUserSessions(userId, s2.id);

    const list = await listUserSessions(userId, s2.id);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(s2.id);
    expect(list[0].isCurrent).toBe(true);

    expect(await validateSession(s1.id)).toBeNull();
    expect(await validateSession(s3.id)).toBeNull();
  });
});
