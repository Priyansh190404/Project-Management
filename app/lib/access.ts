import { prisma } from "./prisma";

/**
 * Prisma "where" fragment for projects a user may work in:
 * projects they own plus projects they were added to as a member.
 *
 *   prisma.project.findFirst({ where: { id, ...accessibleProject(userId) } })
 *   prisma.task.findMany({ where: { project: accessibleProject(userId) } })
 */
export function accessibleProject(userId: string) {
  return {
    OR: [{ userId }, { members: { some: { userId } } }],
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Turns pending invitations for this user's email into real memberships.
 * Safe to call on every request; it does nothing when there is nothing pending.
 */
export async function claimPendingInvites(user: { id: string; email: string }) {
  const email = normalizeEmail(user.email);

  const invites = await prisma.projectInvite.findMany({
    where: { email },
    include: { project: { select: { userId: true } } },
  });

  if (invites.length === 0) {
    return;
  }

  const joinable = invites.filter(
    (invite) => invite.project.userId !== user.id
  );

  if (joinable.length > 0) {
    await prisma.projectMember.createMany({
      data: joinable.map((invite) => ({
        projectId: invite.projectId,
        userId: user.id,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.projectInvite.deleteMany({
    where: { id: { in: invites.map((invite) => invite.id) } },
  });
}

/** True when the user owns the project or is a member of it. */
export async function isProjectParticipant(projectId: number, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...accessibleProject(userId) },
    select: { id: true },
  });

  return Boolean(project);
}
