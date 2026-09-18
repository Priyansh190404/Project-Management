import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
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
    const body = await request.json();

    const {
      title,
      description,
      projectId,
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
    const project = await prisma.project.findUnique({
  where: {
    id: Number(projectId),
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
        projectId: Number(projectId),
      },
      include: {
        project: true,
      },
    });

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
    const body = await request.json();

    const {
      id,
      title,
      description,
      status,
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
    const project = await prisma.project.findUnique({
  where: {
    id: Number(projectId),
  },
});

if (!project) {
  return NextResponse.json(
    { error: "Selected project does not exist" },
    { status: 404 }
  );
}

    const task = await prisma.task.update({
      where: {
        id: Number(id),
      },
      data: {
        title: title.trim(),
        description:
          description?.trim() || "No description provided.",
        status: status || "To Do",
        projectId: Number(projectId),
      },
      include: {
        project: true,
      },
    });

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
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Task id is required" },
        { status: 400 }
      );
    }

    await prisma.task.delete({
      where: {
        id: Number(id),
      },
    });

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