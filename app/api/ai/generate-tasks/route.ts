import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing");

      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const projectId = Number(body.projectId);
    const goal = body.goal?.trim();

    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "Valid project ID is required" },
        { status: 400 }
      );
    }

    if (!goal) {
      return NextResponse.json(
        { error: "Project goal is required" },
        { status: 400 }
      );
    }

    if (goal.length > 2000) {
      return NextResponse.json(
        { error: "Project goal must be less than 2000 characters" },
        { status: 400 }
      );
    }

    // Make sure the project belongs to the logged-in user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const prompt = `
You are an expert software project manager.

Generate a practical implementation task list for the following project.

Project name:
${project.name}

Project description:
${project.description}

User's project goal:
${goal}

Requirements:
- Generate between 5 and 8 tasks.
- Tasks should be actionable and specific.
- Order the tasks logically from setup/foundation to implementation/testing.
- Avoid vague tasks such as "work on the project".
- Each task must have a short title.
- Each task must have a useful description.
- Assign priority as High, Medium, or Low.
- Do not include completed work.
- Do not include explanations outside the JSON structure.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Short actionable task title",
                  },
                  description: {
                    type: Type.STRING,
                    description: "Clear description of what needs to be done",
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
          required: ["tasks"],
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
      tasks?: {
        title?: string;
        description?: string;
        priority?: string;
      }[];
    };

    try {
      result = JSON.parse(text);
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);

      return NextResponse.json(
        { error: "AI returned an invalid response" },
        { status: 502 }
      );
    }

    if (!Array.isArray(result.tasks)) {
      return NextResponse.json(
        { error: "AI did not return a valid task list" },
        { status: 502 }
      );
    }

    const tasks = result.tasks
      .filter(
        (task) =>
          typeof task.title === "string" &&
          typeof task.description === "string" &&
          ["High", "Medium", "Low"].includes(task.priority || "")
      )
      .slice(0, 8)
      .map((task) => ({
        title: task.title!.trim(),
        description: task.description!.trim(),
        priority: task.priority as "High" | "Medium" | "Low",
      }))
      .filter((task) => task.title.length > 0);

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: "AI could not generate valid tasks" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      projectId,
      projectName: project.name,
      tasks,
    });
    } catch (error) {
    console.error("AI task generation failed:", error);

    return NextResponse.json(
      {
        error: "Failed to generate tasks with AI",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}