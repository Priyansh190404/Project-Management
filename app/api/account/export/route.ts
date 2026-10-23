import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

/** Downloads everything you own in TaskFlow as a JSON file. */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      include: {
        documents: true,
        tasks: {
          orderBy: { createdAt: "asc" },
          include: {
            assignee: { select: { name: true, email: true } },
            dependencies: { select: { dependsOnId: true } },
          },
        },
        members: {
          select: { user: { select: { name: true, email: true } } },
        },
      },
    });

    const data = {
      exportedAt: new Date().toISOString(),
      user: {
        name: session.user.name,
        email: session.user.email,
      },
      projects,
    };

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="taskflow-export.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export data:", error);

    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
