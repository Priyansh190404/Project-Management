import { NextResponse } from "next/server";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import {
  accessibleProject,
  claimPendingInvites,
  isValidEmail,
  normalizeEmail,
} from "../../lib/access";

const MAX_MEMBERS_PER_PROJECT = 25;
const MAX_PENDING_INVITES_PER_PROJECT = 25;

async function getSession(request: Request) {
  return await auth.api.getSession({
    headers: request.headers,
  });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Everything the Team page needs: for each project you can work in,
 * who owns it, who belongs to it, and (for owners) who is still invited.
 */
export async function GET(request: Request) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return unauthorized();
    }

    await claimPendingInvites({
      id: session.user.id,
      email: session.user.email,
    });

    const projects = await prisma.project.findMany({
      where: accessibleProject(session.user.id),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        user: { select: { id: true, name: true, email: true } },
        members: {
          orderBy: { createdAt: "asc" },
          select: {
            createdAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        invites: {
          orderBy: { createdAt: "asc" },
          select: { id: true, email: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({
      currentUserId: session.user.id,
      projects: projects.map((project) => {
        const isOwner = project.user?.id === session.user.id;

        const members = project.members.map((member) => ({
          ...member.user,
          joinedAt: member.createdAt,
        }));

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          isOwner,
          owner: project.user,
          members,
          // Only the owner can see or manage pending invitations
          invites: isOwner ? project.invites : [],
          // Everyone a task in this project can be assigned to
          people: [
            ...(project.user ? [{ ...project.user, role: "owner" }] : []),
            ...members.map((member) => ({
              id: member.id,
              name: member.name,
              email: member.email,
              role: "member",
            })),
          ],
        };
      }),
    });
  } catch (error) {
    console.error("Failed to load team:", error);

    return NextResponse.json(
      { error: "Failed to load team" },
      { status: 500 }
    );
  }
}

/** Owner adds someone to a project by email. */
export async function POST(request: Request) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return unauthorized();
    }

    const body = await request.json();
    const projectId = Number(body.projectId);
    const email = normalizeEmail(String(body.email ?? ""));

    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "Project is required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: {
        id: true,
        _count: { select: { members: true, invites: true } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Only the project owner can invite people" },
        { status: 403 }
      );
    }

    if (email === normalizeEmail(session.user.email)) {
      return NextResponse.json(
        { error: "You already own this project" },
        { status: 400 }
      );
    }

    const invitee = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, name: true },
    });

    if (invitee) {
      const existing = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: invitee.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "This person is already on the project" },
          { status: 409 }
        );
      }

      if (project._count.members >= MAX_MEMBERS_PER_PROJECT) {
        return NextResponse.json(
          {
            error: `A project can have up to ${MAX_MEMBERS_PER_PROJECT} members`,
          },
          { status: 400 }
        );
      }

      await prisma.projectMember.create({
        data: { projectId, userId: invitee.id },
      });

      return NextResponse.json(
        { status: "added", name: invitee.name },
        { status: 201 }
      );
    }

    const pending = await prisma.projectInvite.findUnique({
      where: { projectId_email: { projectId, email } },
    });

    if (pending) {
      return NextResponse.json(
        { error: "This email is already invited" },
        { status: 409 }
      );
    }

    if (project._count.invites >= MAX_PENDING_INVITES_PER_PROJECT) {
      return NextResponse.json(
        {
          error: `A project can have up to ${MAX_PENDING_INVITES_PER_PROJECT} pending invitations`,
        },
        { status: 400 }
      );
    }

    await prisma.projectInvite.create({
      data: { projectId, email, invitedById: session.user.id },
    });

    return NextResponse.json({ status: "invited" }, { status: 201 });
  } catch (error) {
    console.error("Failed to add team member:", error);

    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}

/**
 * Three things share this endpoint:
 *  - { inviteId }            owner cancels a pending invitation
 *  - { projectId, userId }   owner removes a member
 *  - { projectId, userId }   with your own id: you leave a project
 */
export async function DELETE(request: Request) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return unauthorized();
    }

    const body = await request.json();

    if (body.inviteId) {
      const invite = await prisma.projectInvite.findFirst({
        where: {
          id: Number(body.inviteId),
          project: { userId: session.user.id },
        },
        select: { id: true },
      });

      if (!invite) {
        return NextResponse.json(
          { error: "Invitation not found" },
          { status: 404 }
        );
      }

      await prisma.projectInvite.delete({ where: { id: invite.id } });

      return NextResponse.json({ message: "Invitation cancelled" });
    }

    const projectId = Number(body.projectId);
    const userId = String(body.userId ?? "");

    if (!projectId || Number.isNaN(projectId) || !userId) {
      return NextResponse.json(
        { error: "Project and member are required" },
        { status: 400 }
      );
    }

    const leaving = userId === session.user.id;

    if (!leaving) {
      const ownsProject = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id },
        select: { id: true },
      });

      if (!ownsProject) {
        return NextResponse.json(
          { error: "Only the project owner can remove people" },
          { status: 403 }
        );
      }
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json(
        {
          error: leaving
            ? "You are not a member of this project"
            : "Member not found",
        },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.task.updateMany({
        where: { projectId, assigneeId: userId },
        data: { assigneeId: null },
      }),
      prisma.projectMember.delete({ where: { id: membership.id } }),
    ]);

    return NextResponse.json({
      message: leaving ? "You left the project" : "Member removed",
    });
  } catch (error) {
    console.error("Failed to update team:", error);

    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}
