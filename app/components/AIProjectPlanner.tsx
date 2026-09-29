"use client";

import { useState } from "react";

type Subtask = {
title: string;
description: string;
priority: "High" | "Medium" | "Low";
};

type PlannedTask = {
title: string;
description: string;
priority: "High" | "Medium" | "Low";
subtasks: Subtask[];
};

type ProjectPlan = {
projectName: string;
projectDescription: string;
tasks: PlannedTask[];
};

export default function AIProjectPlanner() {
const [idea, setIdea] = useState("");
const [loading, setLoading] = useState(false);

const [plan, setPlan] =
useState<ProjectPlan | null>(null);

const [error, setError] = useState("");

async function generatePlan() {
if (!idea.trim()) {
return;
}

setLoading(true);
setError("");
setPlan(null);

try {
  const response = await fetch(
    "/api/ai/plan-project",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idea,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to generate project plan."
    );
  }

  setPlan(data);
} catch (error) {
  console.error(
    "Error generating project plan:",
    error
  );

  setError(
    error instanceof Error
      ? error.message
      : "Failed to generate project plan."
  );
} finally {
  setLoading(false);
}


}
async function createProjectFromPlan() {
  if (!plan) {
    return;
  }

  setLoading(true);
  setError("");

  try {
    // 1. Create the project
    const projectResponse = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: plan.projectName,
        description: plan.projectDescription,
      }),
    });

    const projectData = await projectResponse.json();

    if (!projectResponse.ok) {
      throw new Error(
        projectData.error || "Failed to create project."
      );
    }

    const projectId = projectData.id;

    // 2. Create tasks and their subtasks
    for (const task of plan.tasks) {
      const taskResponse = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          priority: task.priority,
          projectId,
        }),
      });

      const taskData = await taskResponse.json();

      if (!taskResponse.ok) {
        throw new Error(
          taskData.error || `Failed to create task: ${task.title}`
        );
      }

      const parentTaskId = taskData.id;

      // 3. Create subtasks under the parent task
      for (const subtask of task.subtasks) {
        const subtaskResponse = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: subtask.title,
            description: subtask.description,
            priority: subtask.priority,
            projectId,
            parentTaskId,
          }),
        });

        const subtaskData = await subtaskResponse.json();

        if (!subtaskResponse.ok) {
          throw new Error(
            subtaskData.error ||
              `Failed to create subtask: ${subtask.title}`
          );
        }
      }
    }

    // 4. Reset the planner after successful creation
    setPlan(null);
    setIdea("");

    alert("Project created successfully in TaskFlow.");
  } catch (error) {
    console.error(
      "Error creating project from AI plan:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Failed to create project from AI plan."
    );
  } finally {
    setLoading(false);
  }
}
return ( <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm"> <div className="flex items-start gap-4"> <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xl text-white">
✨ </div>

    <div>
      <h2 className="text-lg font-bold text-gray-900">
        AI Project Planner
      </h2>

      <p className="mt-1 text-sm text-gray-600">
        Describe your project idea and let AI
        generate a structured project plan with
        tasks and subtasks.
      </p>
    </div>
  </div>

  <div className="mt-5">
    <label className="mb-2 block text-sm font-medium text-gray-700">
      What do you want to build?
    </label>

    <textarea
      value={idea}
      onChange={(event) =>
        setIdea(event.target.value)
      }
      placeholder="Example: Build an e-commerce website with authentication, product management, cart, payments and order tracking."
      rows={5}
      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </div>

  {error && (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {error}
    </div>
  )}

  <div className="mt-4 flex justify-end gap-3">
  {plan && (
    <button
      type="button"
      disabled={loading}
      onClick={createProjectFromPlan}
      className="rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading
        ? "Creating..."
        : "✓ Create Project in TaskFlow"}
    </button>
  )}

  <button
    type="button"
    disabled={!idea.trim() || loading}
    onClick={generatePlan}
    className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading
      ? "Planning..."
      : "✨ Generate Project Plan"}
  </button>
</div>

  {plan && (
    <div className="mt-8 border-t border-blue-100 pt-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">
          {plan.projectName}
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          {plan.projectDescription}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {plan.tasks.map(
          (task, taskIndex) => (
            <div
              key={taskIndex}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {task.title}
                  </h4>

                  <p className="mt-1 text-sm text-gray-600">
                    {task.description}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {task.priority}
                </span>
              </div>

              {task.subtasks.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Subtasks
                  </p>

                  <div className="space-y-2">
                    {task.subtasks.map(
                      (
                        subtask,
                        subtaskIndex
                      ) => (
                        <div
                          key={
                            subtaskIndex
                          }
                          className="rounded-md bg-gray-50 px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-gray-800">
                              {subtask.title}
                            </p>

                            <span className="text-xs text-gray-500">
                              {
                                subtask.priority
                              }
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-gray-500">
                            {
                              subtask.description
                            }
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )}
</div>

);
}
