import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
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

    const body = await request.json();

    const projectId = Number(body.projectId);

    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "Project id is required." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        tasks: {
          where: {
            parentTaskId: null,
          },
          orderBy: {
            createdAt: "asc",
          },
          include: {
            subtasks: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const projectContext = {
      project: {
        name: project.name,
        description: project.description,
        progress: project.progress,
        status: project.status,
      },
      tasks: project.tasks.map((task) => ({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        subtasks: task.subtasks.map((subtask) => ({
          title: subtask.title,
          description: subtask.description,
          status: subtask.status,
          priority: subtask.priority,
        })),
      })),
    };

    const prompt =
      "You are an AI project management analyst inside an application called TaskFlow.\n\n" +
      "Analyze the provided project data and generate useful project insights.\n\n" +
      "Project data:\n" +
      JSON.stringify(projectContext, null, 2) +
      "\n\n" +
      "Return ONLY valid JSON in this exact structure:\n" +
      "{\n" +
      '  "summary": "short summary of the current project state",\n' +
      '  "health": "Healthy | Needs Attention | At Risk",\n' +
      '  "bottlenecks": ["..."],\n' +
      '  "priorityTasks": ["..."],\n' +
      '  "recommendations": ["..."]\n' +
      "}\n\n" +
      "Rules:\n" +
      "- Base every insight on the provided project data.\n" +
      "- Do not invent tasks, statuses, priorities, progress, or project information.\n" +
      "- Identify unfinished high-priority work when present.\n" +
      "- Identify possible bottlenecks from incomplete tasks or incomplete subtasks.\n" +
      "- Recommendations must be practical and based on the actual project data.\n" +
      "- If there is not enough data for a particular insight, return an empty array.\n" +
      "- Keep each array item concise.\n";

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const text = response.text;

    if (!text) {
      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 500 }
      );
    }

    let insights;

    try {
      insights = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI returned an invalid insights format." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      insights,
    });
  } catch (error) {
    console.error(
      "AI project insights error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate project insights.",
      },
      { status: 500 }
    );
  }
}