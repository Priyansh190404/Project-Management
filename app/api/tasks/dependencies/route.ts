import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

async function getSession(request: Request) {
  return await auth.api.getSession({
    headers: request.headers,
  });
}

async function wouldCreateCycle(
  taskId: number,
  dependsOnId: number
): Promise<boolean> {
  const visited = new Set<number>();
  const queue = [dependsOnId];

  while (queue.length > 0) {
    const currentTaskId = queue.shift()!;

    if (currentTaskId === taskId) {
      return true;
    }

    if (visited.has(currentTaskId)) {
      continue;
    }

    visited.add(currentTaskId);

    const dependencies = await prisma.taskDependency.findMany({
      where: {
        taskId: currentTaskId,
      },
      select: {
        dependsOnId: true,
      },
    });

    for (const dependency of dependencies) {
      if (!visited.has(dependency.dependsOnId)) {
        queue.push(dependency.dependsOnId);
      }
    }
  }

  return false;
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

    const taskId = Number(body.taskId);
    const dependsOnId = Number(body.dependsOnId);

    if (!taskId || !dependsOnId) {
      return NextResponse.json(
        { error: "Task ID and dependency task ID are required" },
        { status: 400 }
      );
    }

    if (taskId === dependsOnId) {
      return NextResponse.json(
        { error: "A task cannot depend on itself" },
        { status: 400 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        id: {
          in: [taskId, dependsOnId],
        },
        project: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (tasks.length !== 2) {
      return NextResponse.json(
        { error: "One or both tasks were not found" },
        { status: 404 }
      );
    }

    const task = tasks.find((item) => item.id === taskId);
    const dependency = tasks.find(
      (item) => item.id === dependsOnId
    );

    if (!task || !dependency) {
      return NextResponse.json(
        { error: "Invalid task dependency" },
        { status: 400 }
      );
    }

    if (task.projectId !== dependency.projectId) {
      return NextResponse.json(
        {
          error: "Tasks must belong to the same project",
        },
        { status: 400 }
      );
    }

    const existingDependency =
      await prisma.taskDependency.findUnique({
        where: {
          taskId_dependsOnId: {
            taskId,
            dependsOnId,
          },
        },
      });

    if (existingDependency) {
      return NextResponse.json(
        { error: "This dependency already exists" },
        { status: 409 }
      );
    }

    const cycleDetected = await wouldCreateCycle(
      taskId,
      dependsOnId
    );

    if (cycleDetected) {
      return NextResponse.json(
        {
          error:
            "This dependency would create a circular dependency",
        },
        { status: 400 }
      );
    }

    const dependencyRecord =
      await prisma.taskDependency.create({
        data: {
          taskId,
          dependsOnId,
        },
        include: {
          task: true,
          dependsOn: true,
        },
      });

    return NextResponse.json(
      dependencyRecord,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create task dependency:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to create task dependency",
        details:
          error instanceof Error
            ? error.message
            : String(error),
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

    const body = await request.json();

    const taskId = Number(body.taskId);
    const dependsOnId = Number(body.dependsOnId);

    if (!taskId || !dependsOnId) {
      return NextResponse.json(
        { error: "Task ID and dependency task ID are required" },
        { status: 400 }
      );
    }

    const dependency =
      await prisma.taskDependency.findFirst({
        where: {
          taskId,
          dependsOnId,
          task: {
            project: {
              userId: session.user.id,
            },
          },
        },
      });

    if (!dependency) {
      return NextResponse.json(
        { error: "Dependency not found" },
        { status: 404 }
      );
    }

    await prisma.taskDependency.delete({
      where: {
        id: dependency.id,
      },
    });

    return NextResponse.json({
      message: "Dependency removed successfully",
    });
  } catch (error) {
    console.error(
      "Failed to delete task dependency:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to delete task dependency",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

