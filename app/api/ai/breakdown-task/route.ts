import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const taskId = Number(body.taskId);

    if (!taskId || Number.isNaN(taskId)) {
      return NextResponse.json(
        { error: "Valid task ID is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const prompt = `
You are an expert software project manager.

Break the following software development task into smaller, practical subtasks.

Project:
${task.project.name}

Main task:
${task.title}

Task description:
${task.description}

Requirements:
- Generate 4 to 8 subtasks.
- Each subtask must be independently actionable.
- Keep subtasks specific and practical.
- Order them logically.
- Do not repeat the original task.
- Do not generate vague tasks.
- Assign each subtask a priority: High, Medium, or Low.
- Return only the requested JSON structure.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Short actionable subtask title",
                  },
                  description: {
                    type: Type.STRING,
                    description: "Clear description of the subtask",
                  },
                  priority: {
                    type: Type.STRING,
                    enum: ["High", "Medium", "Low"],
                  },
                },
                required: ["title", "description", "priority"],
              },
            },
          },
          required: ["subtasks"],
        },
      },
    });

    const text = response.text;

    if (!text) {
      return NextResponse.json(
        { error: "Gemini returned an empty response" },
        { status: 502 }
      );
    }

    let result: {
      subtasks?: {
        title?: string;
        description?: string;
        priority?: string;
      }[];
    };

    try {
      result = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI returned an invalid response" },
        { status: 502 }
      );
    }

    if (!Array.isArray(result.subtasks)) {
      return NextResponse.json(
        { error: "AI did not return a valid subtask list" },
        { status: 502 }
      );
    }

    const subtasks = result.subtasks
      .filter(
        (subtask) =>
          typeof subtask.title === "string" &&
          typeof subtask.description === "string" &&
          ["High", "Medium", "Low"].includes(
            subtask.priority || ""
          )
      )
      .slice(0, 8)
      .map((subtask) => ({
        title: subtask.title!.trim(),
        description: subtask.description!.trim(),
        priority:
          subtask.priority as "High" | "Medium" | "Low",
      }))
      .filter((subtask) => subtask.title.length > 0);

    if (subtasks.length === 0) {
      return NextResponse.json(
        { error: "AI could not generate valid subtasks" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      taskId: task.id,
      taskTitle: task.title,
      projectId: task.projectId,
      projectName: task.project.name,
      subtasks,
    });
  } catch (error) {
    console.error("AI task breakdown failed:", error);

    return NextResponse.json(
      {
        error: "Failed to break down task with AI",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}