"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";
import Sidebar from "../components/Sidebar";

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
  const router = useRouter();

  const { data: session, isPending } =
    authClient.useSession();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("To Do");

  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session?.user) {
      router.replace("/sign-in");
      return;
    }

    fetchData();
  }, [isPending, session, router]);

  async function fetchData() {
    try {
      const projectsResponse = await fetch(
        "/api/projects",
        {
          cache: "no-store",
        }
      );

      if (!projectsResponse.ok) {
        throw new Error("Failed to fetch projects");
      }

      const projectsData =
        await projectsResponse.json();

      setProjects(projectsData);

      const tasksResponse = await fetch(
        "/api/tasks",
        {
          cache: "no-store",
        }
      );

      if (!tasksResponse.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const tasksData =
        await tasksResponse.json();

      setTasks(tasksData);
    } catch (error) {
      console.error(
        "Error loading tasks:",
        error
      );
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
      const response = await fetch(
        "/api/tasks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            projectId: Number(projectId),
          }),
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json();

        console.error(
          "Create task error:",
          errorData
        );

        alert(
          `Failed to create task.\n\n${
            errorData.details ||
            errorData.error ||
            "Unknown error"
          }`
        );

        return;
      }

      const newTask =
        await response.json();

      setTasks((currentTasks) => [
        newTask,
        ...currentTasks,
      ]);

      closeModal();
    } catch (error) {
      console.error(
        "Error creating task:",
        error
      );

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
      const response = await fetch(
        "/api/tasks",
        {
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
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json();

        console.error(
          "Update task error:",
          errorData
        );

        alert(
          `Failed to update task.\n\n${
            errorData.details ||
            errorData.error ||
            "Unknown error"
          }`
        );

        return;
      }

      const updatedTask =
        await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === updatedTask.id
            ? updatedTask
            : task
        )
      );

      closeModal();
    } catch (error) {
      console.error(
        "Error updating task:",
        error
      );

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
      const response = await fetch(
        "/api/tasks",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: task.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json();

        console.error(
          "Delete task error:",
          errorData
        );

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
          (currentTask) =>
            currentTask.id !== task.id
        )
      );
    } catch (error) {
      console.error(
        "Error deleting task:",
        error
      );

      alert("Failed to delete task.");
    }
  }

  // Filter tasks based on search and status
  const filteredTasks = tasks.filter((task) => {
    const search = searchQuery
      .trim()
      .toLowerCase();

    const matchesSearch =
      task.title
        .toLowerCase()
        .includes(search) ||
      task.description
        .toLowerCase()
        .includes(search) ||
      task.project?.name
        .toLowerCase()
        .includes(search);

    const matchesStatus =
      statusFilter === "All" ||
      task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">
          Checking authentication...
        </p>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="ml-64 min-h-screen">
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
            className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800"
          >
            + New Task
          </button>
        </header>

        {/* Search and Filters */}
        <section className="border-b bg-white px-10 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-md">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search tasks..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="status-filter"
                className="text-sm font-medium text-gray-600"
              >
                Status:
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="All">
                  All
                </option>

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
          </div>

          {/* Result Count */}
          {!loading && (
            <p className="mt-3 text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {filteredTasks.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {tasks.length}
              </span>{" "}
              tasks
            </p>
          )}
        </section>

        {/* Tasks */}
        <section className="p-10">
          {loading ? (
            <p className="text-gray-500">
              Loading tasks...
            </p>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                No tasks yet
              </h2>

              <p className="mt-2 text-gray-500">
                Create your first task to get started.
              </p>

              <button
                onClick={openCreateModal}
                className="mt-5 rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800"
              >
                + Create Task
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                No matching tasks
              </h2>

              <p className="mt-2 text-gray-500">
                Try changing your search or status filter.
              </p>

              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                }}
                className="mt-5 rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {task.title}
                    </h2>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {task.status === "Completed" && (
                        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Completed
                        </span>
                      )}

                      {task.status === "In Progress" && (
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                          In Progress
                        </span>
                      )}

                      {task.status === "To Do" && (
                        <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                          To Do
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-3 text-gray-600">
                    {task.description ||
                      "No description provided."}
                  </p>

                  <p className="mt-5 text-sm text-gray-500">
                    Project
                  </p>

                  <p className="font-medium text-gray-900">
                    {task.project?.name ||
                      "Unknown"}
                  </p>

                  {/* Edit and Delete */}
                  <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                    <button
                      onClick={() =>
                        openEditModal(task)
                      }
                      className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteTask(task)
                      }
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
                      No projects available. Create
                      a project first.
                    </p>
                  )}
                </div>

                {/* Status */}
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
      </div>
    </main>
  );
}

