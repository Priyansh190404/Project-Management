import { NextResponse } from "next/server";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

async function getSession(request: Request) {
  return await auth.api.getSession({
    headers: request.headers,
  });
}

async function updateProjectProgress(projectId: number) {
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
    },
    select: {
      status: true,
    },
  });

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const progress =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      progress,
    },
  });

  return progress;
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

    const tasks = await prisma.task.findMany({
      where: {
        project: {
          userId: session.user.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);

    return NextResponse.json(
      { error: "Failed to fetch tasks" },
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

    const {
      title,
      description,
      projectId,
      priority,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: Number(projectId),
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Selected project does not exist" },
        { status: 404 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description:
          description?.trim() || "No description provided.",
        priority: priority || "Medium",
        projectId: Number(projectId),
      },
      include: {
        project: true,
      },
    });

    await updateProjectProgress(Number(projectId));

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);

    return NextResponse.json(
      {
        error: "Failed to create task",
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
      title,
      description,
      status,
      priority,
      projectId,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Task id is required" },
        { status: 400 }
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project is required" },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: Number(id),
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: Number(projectId),
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Selected project does not exist" },
        { status: 404 }
      );
    }

    const oldProjectId = existingTask.projectId;
    const newProjectId = Number(projectId);

    const task = await prisma.task.update({
      where: {
        id: Number(id),
      },
      data: {
        title: title.trim(),
        description:
          description?.trim() || "No description provided.",
        status: status || "To Do",
        priority: priority || "Medium",
        projectId: newProjectId,
      },
      include: {
        project: true,
      },
    });

    // Recalculate the new project's progress.
    await updateProjectProgress(newProjectId);

    // If the task was moved to another project,
    // recalculate the old project's progress too.
    if (oldProjectId !== newProjectId) {
      await updateProjectProgress(oldProjectId);
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to update task:", error);

    return NextResponse.json(
      {
        error: "Failed to update task",
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
        { error: "Task id is required" },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: Number(id),
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const projectId = existingTask.projectId;

    await prisma.task.delete({
      where: {
        id: Number(id),
      },
    });

    await updateProjectProgress(projectId);

    return NextResponse.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete task:", error);

    return NextResponse.json(
      {
        error: "Failed to delete task",
        details: String(error),
      },
      { status: 500 }
    );
  }
}