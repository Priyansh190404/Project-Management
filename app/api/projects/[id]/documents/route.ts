import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const projectId = Number(id);

    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project id." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    const name = body.name;
    const content = body.content;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        { error: "Document name is required." },
        { status: 400 }
      );
    }

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return NextResponse.json(
        { error: "Document content is required." },
        { status: 400 }
      );
    }

    const document =
      await prisma.projectDocument.create({
        data: {
          name: name.trim(),
          content: content.trim(),
          projectId,
        },
      });

    return NextResponse.json(
      {
        document,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create project document error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create project document.",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const projectId = Number(id);

    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project id." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const documents =
      await prisma.projectDocument.findMany({
        where: {
          projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      documents,
    });
  } catch (error) {
    console.error(
      "Get project documents error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load project documents.",
      },
      { status: 500 }
    );
  }
}
