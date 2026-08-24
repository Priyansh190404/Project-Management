"use client";

import { useEffect, useState } from "react";

type Project = {
  id: number;
  name: string;
};

type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
  projectId: number;
  project?: Project;
  createdAt: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("To Do");

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const projectsResponse = await fetch("/api/projects", {
        cache: "no-store",
      });

      if (!projectsResponse.ok) {
        throw new Error("Failed to fetch projects");
      }

      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      const tasksResponse = await fetch("/api/tasks", {
        cache: "no-store",
      });

      if (!tasksResponse.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const tasksData = await tasksResponse.json();
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setProjectId("");
    setStatus("To Do");
    setEditingTask(null);
  }

  function openCreateModal() {
    resetForm();
    setShowModal(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setProjectId(String(task.projectId));
    setStatus(task.status);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    resetForm();
  }

  async function createTask() {
    if (!title.trim()) {
      alert("Please enter a task title.");
      return;
    }

    if (!projectId) {
      alert("Please select a project.");
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          projectId: Number(projectId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        console.error("Create task error:", errorData);

        alert(
          `Failed to create task.\n\n${
            errorData.details ||
            errorData.error ||
            "Unknown error"
          }`
        );

        return;
      }

      const newTask = await response.json();

      setTasks((currentTasks) => [
        newTask,
        ...currentTasks,
      ]);

      closeModal();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task.");
    }
  }

  async function updateTask() {
    if (!editingTask) {
      return;
    }

    if (!title.trim()) {
      alert("Please enter a task title.");
      return;
    }

    if (!projectId) {
      alert("Please select a project.");
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingTask.id,
          title,
          description,
          status,
          projectId: Number(projectId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        console.error("Update task error:", errorData);

        alert(
          `Failed to update task.\n\n${
            errorData.details ||
            errorData.error ||
            "Unknown error"
          }`
        );

        return;
      }

      const updatedTask = await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === updatedTask.id
            ? updatedTask
            : task
        )
      );

      closeModal();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task.");
    }
  }

  async function deleteTask(task: Task) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: task.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        console.error("Delete task error:", errorData);

        alert(
          `Failed to delete task.\n\n${
            errorData.details ||
            errorData.error ||
            "Unknown error"
          }`
        );

        return;
      }

      setTasks((currentTasks) =>
        currentTasks.filter(
          (currentTask) => currentTask.id !== task.id
        )
      );
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tasks
          </h1>

          <p className="mt-1 text-gray-500">
            Manage and track your tasks.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          + New Task
        </button>
      </header>

      {/* Tasks */}
      <section className="p-10">

        {loading ? (
          <p className="text-gray-500">
            Loading tasks...
          </p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500">
            No tasks yet. Create your first task.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl bg-white p-6 shadow"
              >
                <h2 className="text-xl font-bold text-gray-900">
                  {task.title}
                </h2>

                <p className="mt-2 text-gray-600">
                  {task.description}
                </p>

                <p className="mt-4 text-sm text-gray-500">
                  Project:{" "}
                  <span className="font-medium text-gray-900">
                    {task.project?.name || "Unknown"}
                  </span>
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Status:{" "}
                  <span className="font-medium text-gray-900">
                    {task.status}
                  </span>
                </p>

                {/* Edit and Delete */}
                <div className="mt-5 flex justify-end gap-3">

                  <button
                    onClick={() => openEditModal(task)}
                    className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteTask(task)}
                    className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                  >
                    Delete
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}

      </section>

      {/* Create / Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">

          <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between">

              <h2 className="text-3xl font-bold text-gray-900">
                {editingTask
                  ? "Edit Task"
                  : "Create New Task"}
              </h2>

              <button
                onClick={closeModal}
                className="text-3xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>

            </div>

            <div className="mt-8 space-y-6">

              {/* Title */}
              <div>
                <label className="mb-2 block text-lg font-medium text-gray-700">
                  Task Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Enter task title"
                  className="w-full rounded-lg border border-gray-300 px-4 py-4 text-lg outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-lg font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe your task"
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 px-4 py-4 text-lg outline-none focus:border-blue-500"
                />
              </div>

              {/* Project */}
              <div>
                <label className="mb-2 block text-lg font-medium text-gray-700">
                  Project
                </label>

                <select
                  value={projectId}
                  onChange={(e) =>
                    setProjectId(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-4 text-lg outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select a project
                  </option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>

                {projects.length === 0 && (
                  <p className="mt-2 text-sm text-red-500">
                    No projects available. Create a
                    project first.
                  </p>
                )}
              </div>

              {/* Status - only while editing */}
              {editingTask && (
                <div>
                  <label className="mb-2 block text-lg font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-4 text-lg outline-none focus:border-blue-500"
                  >
                    <option value="To Do">
                      To Do
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="Completed">
                      Completed
                    </option>
                  </select>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={
                  editingTask
                    ? updateTask
                    : createTask
                }
                disabled={projects.length === 0}
                className="w-full rounded-lg bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {editingTask
                  ? "Update Task"
                  : "Create Task"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}