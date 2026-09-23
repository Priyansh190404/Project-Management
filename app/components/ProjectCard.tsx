"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GeneratedTask = {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
};

type ProjectCardProps = {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: "In Progress" | "Completed";
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
};

export default function ProjectCard({
  id,
  name,
  description,
  progress,
  status,
  onDelete,
  onEdit,
}: ProjectCardProps) {
  const router = useRouter();

  const [showAIModal, setShowAIModal] = useState(false);
  const [goal, setGoal] = useState("");
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [addingTasks, setAddingTasks] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function openProject() {
    router.push(`/projects/${id}`);
  }

  function openAIModal() {
    setShowAIModal(true);
    setGoal("");
    setGeneratedTasks([]);
    setSelectedTasks([]);
    setError("");
    setSuccess("");
  }

  function closeAIModal() {
    if (loadingAI || addingTasks) {
      return;
    }

    setShowAIModal(false);
  }

  async function generateTasks() {
    if (!goal.trim()) {
      setError("Please describe what you want to build.");
      return;
    }

    setLoadingAI(true);
    setError("");
    setSuccess("");
    setGeneratedTasks([]);
    setSelectedTasks([]);

    try {
      const response = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: id,
          goal: goal.trim(),
        }),
      });

      const data = await response.json();
if (!response.ok) {
  const errorData = await response.json().catch(() => null);

  throw new Error(
    errorData?.details ||
      errorData?.error ||
      "Failed to generate tasks with AI"
  );
}

      setGeneratedTasks(data.tasks);

      // Select all generated tasks by default
      setSelectedTasks(
        data.tasks.map((_: GeneratedTask, index: number) => index)
      );
    } catch (error) {
      console.error("AI task generation error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate tasks"
      );
    } finally {
      setLoadingAI(false);
    }
  }

  function toggleTask(index: number) {
    setSelectedTasks((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  }

  function toggleAllTasks() {
    if (selectedTasks.length === generatedTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(
        generatedTasks.map((_, index) => index)
      );
    }
  }

  async function addSelectedTasks() {
    if (selectedTasks.length === 0) {
      setError("Select at least one task.");
      return;
    }

    setAddingTasks(true);
    setError("");
    setSuccess("");

    try {
      const tasksToAdd = selectedTasks.map(
        (index) => generatedTasks[index]
      );

      for (const task of tasksToAdd) {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            projectId: id,
            priority: task.priority,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `Failed to add task: ${task.title}`
          );
        }
      }

      setSuccess(
        `${tasksToAdd.length} task${
          tasksToAdd.length === 1 ? "" : "s"
        } added successfully!`
      );

      setGeneratedTasks([]);
      setSelectedTasks([]);

      // Refresh the current page data
      router.refresh();
    } catch (error) {
      console.error("Failed to add AI tasks:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to add tasks"
      );
    } finally {
      setAddingTasks(false);
    }
  }

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <button
              onClick={openProject}
              className="text-left text-xl font-semibold text-gray-900 transition hover:text-blue-600"
            >
              {name}
            </button>

            <p className="mt-2 text-gray-500">
              {description}
            </p>
          </div>

          <button
            onClick={openProject}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            View
          </button>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Progress</span>

            <span className="font-medium text-gray-700">
              {progress}%
            </span>
          </div>

          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{
                width: `${Math.min(Math.max(progress, 0), 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={openAIModal}
            className="w-full rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
          >
            ✨ Generate Tasks with AI
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span
            className={`rounded-full px-3 py-1 text-sm ${
              status === "Completed"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {status}
          </span>

          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(id)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                >
                  Edit
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(id)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    ✨ Generate Tasks with AI
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Let Gemini break your project into actionable tasks.
                  </p>
                </div>

                <button
                  onClick={closeAIModal}
                  disabled={loadingAI || addingTasks}
                  className="rounded-lg px-3 py-1.5 text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Project
                </label>

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800">
                  {name}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  What do you want to build?
                </label>

                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Example: Build an e-commerce website with user authentication, product listing, shopping cart and online payments."
                  rows={5}
                  disabled={loadingAI || addingTasks}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Be specific about the features you want to build.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              {generatedTasks.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        AI Generated Tasks
                      </h3>

                      <p className="text-xs text-gray-500">
                        {selectedTasks.length} of{" "}
                        {generatedTasks.length} selected
                      </p>
                    </div>

                    <button
                      onClick={toggleAllTasks}
                      disabled={addingTasks}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700"
                    >
                      {selectedTasks.length === generatedTasks.length
                        ? "Deselect all"
                        : "Select all"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {generatedTasks.map((task, index) => {
                      const selected = selectedTasks.includes(index);

                      return (
                        <button
                          key={`${task.title}-${index}`}
                          onClick={() => toggleTask(index)}
                          disabled={addingTasks}
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            selected
                              ? "border-purple-300 bg-purple-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                selected
                                  ? "border-purple-600 bg-purple-600 text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {selected && (
                                <span className="text-xs">✓</span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="font-medium text-gray-900">
                                  {task.title}
                                </h4>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                    task.priority === "High"
                                      ? "bg-red-100 text-red-700"
                                      : task.priority === "Medium"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              </div>

                              <p className="mt-1 text-sm leading-5 text-gray-500">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  onClick={closeAIModal}
                  disabled={loadingAI || addingTasks}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                {generatedTasks.length === 0 ? (
                  <button
                    onClick={generateTasks}
                    disabled={loadingAI || addingTasks}
                    className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingAI
                      ? "Generating..."
                      : "✨ Generate Tasks"}
                  </button>
                ) : (
                  <button
                    onClick={addSelectedTasks}
                    disabled={
                      addingTasks || selectedTasks.length === 0
                    }
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingTasks
                      ? "Adding Tasks..."
                      : `Add ${selectedTasks.length} Task${
                          selectedTasks.length === 1 ? "" : "s"
                        }`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}