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
    const question = body.question;

    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "Project id is required." },
        { status: 400 }
      );
    }

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return NextResponse.json(
        { error: "Question is required." },
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
      "You are an AI project assistant inside a project management application called TaskFlow.\n\n" +
      "Answer the user's question using the provided TaskFlow project data.\n\n" +
      "Project data:\n" +
      JSON.stringify(projectContext, null, 2) +
      "\n\n" +
      "User question:\n" +
      question.trim() +
      "\n\n" +
      "Rules:\n" +
      "- Base your answer on the provided project data.\n" +
      "- Do not invent tasks, statuses, priorities, progress, or project information.\n" +
      "- If the requested information is not available in the project data, clearly say that it is not available.\n" +
      "- You may summarize, analyze, and identify patterns in the provided data.\n" +
      "- Keep the answer practical and concise.\n";

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const answer = response.text;

    if (!answer) {
      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      answer,
    });
  } catch (error) {
    console.error(
      "AI project assistant error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate AI response.",
      },
      { status: 500 }
    );
  }
}