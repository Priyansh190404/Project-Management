"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import Sidebar from "../../components/Sidebar";
import AIProjectAssistant from "../../components/AIProjectAssistant";
import AIProjectInsights from "../../components/AIProjectInsights";
import ProjectDocuments from "../../components/ProjectDocuments";

type Project = {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: "In Progress" | "Completed";
  createdAt: string;
  role?: "owner" | "member";
  ownerName?: string | null;
};

type Task = {
  id: number;
  title: string;
  description: string;
  status: "To Do" | "In Progress" | "Completed";
  projectId: number;
  priority?: string;
  assigneeId?: string | null;
  assignee?: {
    id: string;
    name: string;
  } | null;
  project?: {
    id: number;
    name: string;
  };
  createdAt: string;
};

type Person = {
  id: string;
  name: string;
};

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const projectId = Number(params.id);

  const { data: session, isPending } = authClient.useSession();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] =
    useState<"To Do" | "In Progress" | "Completed">("To Do");

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      router.replace("/sign-in");
      return;
    }

    if (!projectId || Number.isNaN(projectId)) {
      router.replace("/projects");
      return;
    }

    fetchProjectData();
  }, [isPending, session, router, projectId]);

  async function fetchProjectData() {
    try {
      setLoading(true);
      setError("");

      const [projectsResponse, tasksResponse] = await Promise.all([
        fetch("/api/projects", {
          cache: "no-store",
        }),
        fetch("/api/tasks", {
          cache: "no-store",
        }),
      ]);

      if (!projectsResponse.ok) {
        throw new Error("Failed to fetch project");
      }

      if (!tasksResponse.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const projectsData: Project[] = await projectsResponse.json();
      const tasksData: Task[] = await tasksResponse.json();

      const currentProject = projectsData.find(
        (item) => item.id === projectId
      );

      if (!currentProject) {
        setProject(null);
        setError("Project not found.");
        return;
      }

      setProject(currentProject);

      setTasks(
        tasksData.filter((task) => task.projectId === projectId)
      );

      // Who tasks can be assigned to. Assignment is optional, so a failure here is not fatal.
      try {
        const teamResponse = await fetch("/api/team", {
          cache: "no-store",
        });

        if (teamResponse.ok) {
          const teamData: {
            projects: { id: number; people: Person[] }[];
          } = await teamResponse.json();

          setPeople(
            teamData.projects.find((item) => item.id === projectId)?.people ?? []
          );
        }
      } catch (teamError) {
        console.error("Error loading team:", teamError);
      }
    } catch (error) {
      console.error("Error loading project:", error);
      setError("Unable to load project.");
    } finally {
      setLoading(false);
    }
  }

  const taskStats = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "To Do").length,
      inProgress: tasks.filter(
        (task) => task.status === "In Progress"
      ).length,
      completed: tasks.filter(
        (task) => task.status === "Completed"
      ).length,
    };
  }, [tasks]);

  function openCreateTaskModal() {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskStatus("To Do");
    setShowTaskModal(true);
  }

  function openEditTaskModal(task: Task) {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskStatus(task.status);
    setShowTaskModal(true);
  }

  function closeTaskModal() {
    setShowTaskModal(false);
    setEditingTask(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskStatus("To Do");
  }

  async function saveTask() {
    if (!taskTitle.trim()) return;

    try {
      if (editingTask) {
        const response = await fetch("/api/tasks", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingTask.id,
            title: taskTitle,
            description: taskDescription,
            status: taskStatus,
            priority: editingTask.priority,
            projectId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update task");
        }

        const updatedTask: Task = await response.json();

        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          )
        );
      } else {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: taskTitle,
            description: taskDescription,
            projectId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create task");
        }

        const newTask: Task = await response.json();

        setTasks((currentTasks) => [newTask, ...currentTasks]);
      }

      closeTaskModal();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  }

  async function deleteTask(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== id)
      );
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }

  async function changeTaskStatus(
    task: Task,
    status: "To Do" | "In Progress" | "Completed"
  ) {
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: task.id,
          title: task.title,
          description: task.description,
          status,
          priority: task.priority,
          projectId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      const updatedTask: Task = await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === updatedTask.id
            ? updatedTask
            : currentTask
        )
      );
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  }

  async function assignTask(task: Task, assigneeId: string) {
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          projectId,
          assigneeId: assigneeId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign task");
      }

      const updatedTask: Task = await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === updatedTask.id
            ? updatedTask
            : currentTask
        )
      );
    } catch (error) {
      console.error("Error assigning task:", error);
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Sidebar />

        <main className="flex min-h-screen items-center justify-center lg:ml-64">
          <div className="text-sm text-gray-500">
            Loading project...
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Sidebar />

        <main className="flex min-h-screen items-center justify-center px-6 lg:ml-64">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              {error || "Project not found"}
            </h1>

            <p className="mt-2 text-gray-500">
              The project may have been deleted or may not exist.
            </p>

            <button
              onClick={() => router.push("/projects")}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Back to Projects
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <main className="min-h-screen px-4 py-5 sm:px-8 sm:py-8 lg:ml-64">
        <div className="mx-auto max-w-7xl">
          {/* Back button */}
          <button
            onClick={() => router.push("/projects")}
            className="mb-6 flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
          >
            <span className="text-lg">←</span>
            Back to Projects
          </button>

          {/* Project Header */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                    Project
                  </span>
                  {project.role === "member" && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      Shared by {project.ownerName ?? "the owner"}
                    </span>
                  )}

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      project.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {project.name}
                </h1>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  {project.description}
                </p>
              </div>

              <button
                onClick={openCreateTaskModal}
                className="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + New Task
              </button>
            </div>

            {/* Progress */}
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Project Progress
                </span>

                <span className="font-semibold text-gray-900">
                  {project.progress}%
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(project.progress, 0),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Tasks
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {taskStats.total}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                To Do
              </p>

              <p className="mt-2 text-2xl font-bold text-yellow-600">
                {taskStats.todo}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                In Progress
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-600">
                {taskStats.inProgress}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Completed
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {taskStats.completed}
              </p>
            </div>
          </section>

          {/* Tasks */}
          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Project Tasks
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage tasks associated with this project.
                </p>
              </div>

              <span className="text-sm text-gray-400">
                {tasks.length}{" "}
                {tasks.length === 1 ? "task" : "tasks"}
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">
                  ✓
                </div>

                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No tasks yet
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Create your first task for this project.
                </p>

                <button
                  onClick={openCreateTaskModal}
                  className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  + Create Task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-semibold text-gray-900">
                            {task.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              task.status === "Completed"
                                ? "bg-green-100 text-green-700"
                                : task.status === "In Progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                          {task.description}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {people.length > 1 && (
                          <select
                            value={task.assigneeId ?? ""}
                            onChange={(event) =>
                              assignTask(task, event.target.value)
                            }
                            aria-label={`Assign "${task.title}"`}
                            className="max-w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
                          >
                            <option value="">Unassigned</option>
                            {people.map((person) => (
                              <option key={person.id} value={person.id}>
                                {person.id === session?.user?.id
                                  ? `${person.name} (you)`
                                  : person.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <select
                          value={task.status}
                          onChange={(event) =>
                            changeTaskStatus(
                              task,
                              event.target.value as
                                | "To Do"
                                | "In Progress"
                                | "Completed"
                            )
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
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

                        <button
                          onClick={() =>
                            openEditTaskModal(task)
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteTask(task.id)
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <AIProjectAssistant projectId={projectId} />

          <AIProjectInsights projectId={projectId} />

          <ProjectDocuments projectId={projectId} />
        </div>
      </main>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTask
                    ? "Edit Task"
                    : "Create Task"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingTask
                    ? "Update the task details."
                    : `Add a task to ${project.name}.`}
                </p>
              </div>

              <button
                onClick={closeTaskModal}
                className="text-xl text-gray-400 transition hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Task Title
                </label>

                <input
                  type="text"
                  value={taskTitle}
                  onChange={(event) =>
                    setTaskTitle(event.target.value)
                  }
                  placeholder="Enter task title"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={taskDescription}
                  onChange={(event) =>
                    setTaskDescription(event.target.value)
                  }
                  placeholder="Describe the task"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>

              {editingTask && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    value={taskStatus}
                    onChange={(event) =>
                      setTaskStatus(
                        event.target.value as
                          | "To Do"
                          | "In Progress"
                          | "Completed"
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500"
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
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={closeTaskModal}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900"
              >
                Cancel
              </button>

              <button
                onClick={saveTask}
                disabled={!taskTitle.trim()}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingTask
                  ? "Save Changes"
                  : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

