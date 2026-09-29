import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { auth } from "../../../lib/auth";

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
const idea = body.idea;

if (typeof idea !== "string" || !idea.trim()) {
  return NextResponse.json(
    { error: "Project idea is required." },
    { status: 400 }
  );
}

const prompt =
  "You are an expert software project planner.\n\n" +
  "Create a practical software development project plan " +
  "from the user's project idea.\n\n" +
  "Project idea:\n" +
  idea +
  "\n\n" +
  "Generate:\n" +
  "- A clear project name\n" +
  "- A short project description\n" +
  "- Logical task groups\n" +
  "- Concrete tasks inside each group\n" +
  "- Useful subtasks for each task\n" +
  "- Priority for every task\n\n" +
  "Keep the plan realistic for a software development project.\n\n" +
  "Do not generate vague tasks such as Build the project " +
  "or Complete development.\n\n" +
  "Return only structured data matching the provided schema.";

const response = await ai.models.generateContent({
  model: "gemini-3.8-flash",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        projectName: {
          type: Type.STRING,
        },

        projectDescription: {
          type: Type.STRING,
        },

        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
              },

              description: {
                type: Type.STRING,
              },

              priority: {
                type: Type.STRING,
                enum: [
                  "High",
                  "Medium",
                  "Low",
                ],
              },

              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                    },

                    description: {
                      type: Type.STRING,
                    },

                    priority: {
                      type: Type.STRING,
                      enum: [
                        "High",
                        "Medium",
                        "Low",
                      ],
                    },
                  },

                  required: [
                    "title",
                    "description",
                    "priority",
                  ],
                },
              },
            },

            required: [
              "title",
              "description",
              "priority",
              "subtasks",
            ],
          },
        },
      },

      required: [
        "projectName",
        "projectDescription",
        "tasks",
      ],
    },
  },
});

const text = response.text;

if (!text) {
  return NextResponse.json(
    { error: "AI returned an empty response." },
    { status: 500 }
  );
}

let plan;

try {
  plan = JSON.parse(text);
} catch {
  return NextResponse.json(
    { error: "AI returned invalid structured data." },
    { status: 500 }
  );
}

return NextResponse.json(plan);

} catch (error) {
console.error(
"AI project planning error:",
error
);

return NextResponse.json(
{
error:
error instanceof Error
? error.message
: "Unknown AI error.",
},
{ status: 500 }
);
}

}
