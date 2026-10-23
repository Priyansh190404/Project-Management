import { NextResponse } from "next/server";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { accessibleProject } from "../../lib/access";

async function getSession(request: Request) {
  return await auth.api.getSession({
    headers: request.headers,
  });
}

async function updateProjectProgress(projectId: number) {
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      parentTaskId: null,
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

// A task can only be assigned to someone who owns or belongs to its project.
async function resolveAssignee(
  assigneeId: unknown,
  projectId: number
): Promise<{ ok: true; value: string | null } | { ok: false }> {
  if (assigneeId === null || assigneeId === "") {
    return { ok: true, value: null };
  }

  if (typeof assigneeId !== "string") {
    return { ok: false };
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...accessibleProject(assigneeId),
    },
    select: { id: true },
  });

  return project ? { ok: true, value: assigneeId } : { ok: false };
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
        project: accessibleProject(session.user.id),
        parentTaskId: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    include: {
  project: true,
  assignee: {
    select: {
      id: true,
      name: true,
    },
  },
  subtasks: {
    orderBy: {
      createdAt: "asc",
    },
  },
  dependencies: {
    include: {
      dependsOn: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  },
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
      parentTaskId,
      assigneeId,
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
        ...accessibleProject(session.user.id),
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Selected project does not exist" },
        { status: 404 }
      );
    }

    let validParentTaskId: number | null = null;

    if (parentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: {
          id: Number(parentTaskId),
          projectId: Number(projectId),
          parentTaskId: null,
          project: accessibleProject(session.user.id),
        },
      });

      if (!parentTask) {
        return NextResponse.json(
          {
            error:
              "Invalid parent task. Subtasks cannot have subtasks.",
          },
          { status: 400 }
        );
      }

      validParentTaskId = Number(parentTaskId);
    }

    let assigneeValue: string | null = null;

    if (assigneeId !== undefined) {
      const resolved = await resolveAssignee(
        assigneeId,
        Number(projectId)
      );

      if (!resolved.ok) {
        return NextResponse.json(
          { error: "Assignee must be a member of this project." },
          { status: 400 }
        );
      }

      assigneeValue = resolved.value;
    }

    const task = await prisma.task.create({
      data: {
        assigneeId: assigneeValue,
        title: title.trim(),
        description:
          description?.trim() || "No description provided.",
        priority: priority || "Medium",
        projectId: Number(projectId),
        parentTaskId: validParentTaskId,
      },
      include: {
        project: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        subtasks: true,
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
      assigneeId,
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
        project: accessibleProject(session.user.id),
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
        ...accessibleProject(session.user.id),
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

    // A subtask cannot be moved to a different project.
    if (
      existingTask.parentTaskId !== null &&
      oldProjectId !== newProjectId
    ) {
      return NextResponse.json(
        {
          error:
            "A subtask cannot be moved to another project.",
        },
        { status: 400 }
      );
    }

    // Only touch the assignee when the caller sent one, so older callers
    // (like the status dropdown) never clear it by accident.
    let assigneeUpdate: { assigneeId: string | null } | undefined;

    if (assigneeId !== undefined) {
      const resolved = await resolveAssignee(assigneeId, newProjectId);

      if (!resolved.ok) {
        return NextResponse.json(
          { error: "Assignee must be a member of this project." },
          { status: 400 }
        );
      }

      assigneeUpdate = { assigneeId: resolved.value };
    } else if (
      oldProjectId !== newProjectId &&
      existingTask.assigneeId
    ) {
      const stillAllowed = await resolveAssignee(
        existingTask.assigneeId,
        newProjectId
      );

      if (!stillAllowed.ok) {
        assigneeUpdate = { assigneeId: null };
      }
    }

    const task = await prisma.task.update({
      where: {
        id: Number(id),
      },
      data: {
        ...assigneeUpdate,
        title: title.trim(),
        description:
          description?.trim() || "No description provided.",
        status: status || "To Do",
        priority: priority || "Medium",
        projectId: newProjectId,
      },
      include: {
        project: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        subtasks: true,
      },
    });

    await updateProjectProgress(newProjectId);

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
        project: accessibleProject(session.user.id),
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