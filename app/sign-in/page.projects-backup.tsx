"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "../lib/auth-client";
import ProjectCard from "../components/ProjectCard";
import Sidebar from "../components/Sidebar";

type Project = {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: "In Progress" | "Completed";
  createdAt: string;
};

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: session, isPending } =
    authClient.useSession();

  const [showModal, setShowModal] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] =
    useState("");

  const [editProgress, setEditProgress] = useState(0);

  const [editStatus, setEditStatus] =
    useState<"In Progress" | "Completed">(
      "In Progress"
    );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session?.user) {
      router.replace("/sign-in");
      return;
    }

    fetchProjects();

    if (searchParams.get("new") === "true") {
      setShowModal(true);
    }
  }, [
    isPending,
    session,
    router,
    searchParams,
  ]);

  async function fetchProjects() {
    try {
      const response = await fetch(
        "/api/projects",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch projects"
        );
      }

      const data = await response.json();

      setProjects(data);
    } catch (error) {
      console.error(
        "Error loading projects:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteProject(id: number) {
    try {
      const response = await fetch(
        "/api/projects",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete project"
        );
      }

      await fetchProjects();
    } catch (error) {
      console.error(
        "Error deleting project:",
        error
      );
    }
  }

  async function createProject() {
    if (!projectName.trim()) {
      return;
    }

    try {
      const response = await fetch(
        "/api/projects",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: projectName,
            description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to create project"
        );
      }

      const newProject =
        await response.json();

      setProjects((currentProjects) => [
        ...currentProjects,
        newProject,
      ]);

      setProjectName("");
      setDescription("");
      setShowModal(false);
    } catch (error) {
      console.error(
        "Error creating project:",
        error
      );
    }
  }

  function openEditModal(project: Project) {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(
      project.description
    );
    setEditProgress(project.progress);
    setEditStatus(project.status);
  }

  async function updateProject() {
    if (
      !editingProject ||
      !editName.trim()
    ) {
      return;
    }

    const finalProgress =
      editStatus === "Completed"
        ? 100
        : editProgress;

    try {
      const response = await fetch(
        "/api/projects",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingProject.id,
            name: editName,
            description: editDescription,
            progress: finalProgress,
            status: editStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update project"
        );
      }

      const updatedProject =
        await response.json();

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === updatedProject.id
            ? updatedProject
            : project
        )
      );

      setEditingProject(null);
    } catch (error) {
      console.error(
        "Error updating project:",
        error
      );
    }
  }

  const filteredProjects =
    projects.filter((project) => {
      const search =
        searchQuery
          .trim()
          .toLowerCase();

      const matchesSearch =
        project.name
          .toLowerCase()
          .includes(search) ||
        project.description
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        project.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-400">
          Checking authentication...
        </p>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <div className="ml-64 min-h-screen">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-950/95 px-8 py-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Projects
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage and track all your projects.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              + New Project
            </button>
          </div>
        </header>

        {/* Search and Filters */}
        <section className="border-b border-slate-800 bg-slate-950 px-10 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-md">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                🔍
              </span>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search projects..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="project-status-filter"
                className="text-sm font-medium text-slate-400"
              >
                Status:
              </label>

              <select
                id="project-status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500"
              >
                <option value="All">All</option>

                <option value="In Progress">
                  In Progress
                </option>

                <option value="Completed">
                  Completed
                </option>
              </select>
            </div>
          </div>

          {!loading && (
            <p className="mt-3 text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-300">
                {filteredProjects.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-300">
                {projects.length}
              </span>{" "}
              projects
            </p>
          )}
        </section>

        {/* Projects */}
        <section className="p-10">
          {loading ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <p className="text-slate-400">
                Loading projects...
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-lg">
                +
              </div>

              <h2 className="mt-4 text-xl font-semibold">
                No projects yet
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Create your first project to get started.
              </p>

              <button
                onClick={() => setShowModal(true)}
                className="mt-6 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                + Create Project
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
              <h2 className="text-xl font-semibold">
                No matching projects
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Try changing your search or status filter.
              </p>

              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                }}
                className="mt-6 rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  description={project.description}
                  progress={project.progress}
                  status={project.status}
                  onDelete={deleteProject}
                  onEdit={() =>
                    openEditModal(project)
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Create Project Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Create New Project
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Add a project to your workspace.
                  </p>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="text-2xl text-slate-500 transition hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Project Name
                  </label>

                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) =>
                      setProjectName(e.target.value)
                    }
                    placeholder="Enter project name"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    placeholder="Describe your project"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={createProject}
                  disabled={!projectName.trim()}
                  className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Edit Project
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Update your project details.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setEditingProject(null)
                  }
                  className="text-2xl text-slate-500 transition hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Project Name
                  </label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) =>
                      setEditName(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Description
                  </label>

                  <textarea
                    value={editDescription}
                    onChange={(e) =>
                      setEditDescription(e.target.value)
                    }
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Progress: {editProgress}%
                  </label>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => {
                      const value = Number(
                        e.target.value
                      );

                      setEditProgress(value);

                      if (value === 100) {
                        setEditStatus("Completed");
                      } else {
                        setEditStatus("In Progress");
                      }
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Status
                  </label>

                  <select
                    value={editStatus}
                    onChange={(e) => {
                      const status =
                        e.target.value as
                          | "In Progress"
                          | "Completed";

                      setEditStatus(status);

                      if (status === "Completed") {
                        setEditProgress(100);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="Completed">
                      Completed
                    </option>
                  </select>
                </div>

                <button
                  onClick={updateProject}
                  disabled={!editName.trim()}
                  className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Update Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}