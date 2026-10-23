import { NextResponse } from "next/server";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { accessibleProject, claimPendingInvites } from "../../lib/access";

async function getSession(request: Request) {
  return await auth.api.getSession({
    headers: request.headers,
  });
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Anyone invited by email before they had an account joins on their first request
    await claimPendingInvites({
      id: session.user.id,
      email: session.user.email,
    });

    const projects = await prisma.project.findMany({
      where: accessibleProject(session.user.id),
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // "owner" can edit or delete the project; "member" can work on its tasks and documents
    return NextResponse.json(
      projects.map(({ user, ...project }) => ({
        ...project,
        role: project.userId === session.user.id ? "owner" : "member",
        ownerName: user?.name ?? null,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch projects:", error);

    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description:
          description?.trim() || "No description provided.",
        userId: session.user.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);

    return NextResponse.json(
      {
        error: "Failed to create project",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      id,
      name,
      description,
      progress,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Project id is required" },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const existingProject = await prisma.project.findFirst({
      where: {
        id: Number(id),
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const project = await prisma.project.update({
      where: {
        id: Number(id),
      },
      data: {
        name: name.trim(),
        description:
          description?.trim() || "No description provided.",
        progress: Number(progress),
        status: status || "In Progress",
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to update project:", error);

    return NextResponse.json(
      {
        error: "Failed to update project",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Project id is required" },
        { status: 400 }
      );
    }

    const existingProject = await prisma.project.findFirst({
      where: {
        id: Number(id),
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    await prisma.project.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete project:", error);

    return NextResponse.json(
      {
        error: "Failed to delete project",
        details: String(error),
      },
      { status: 500 }
    );
  }
}