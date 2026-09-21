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

  // Create project state
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit project state
  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] =
    useState("");

  const [editProgress, setEditProgress] =
    useState(0);

  const [editStatus, setEditStatus] =
    useState<"In Progress" | "Completed">(
      "In Progress"
    );

  // Search and filter
  const [searchQuery, setSearchQuery] =
    useState("");

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

  // Search + status filtering
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
              Projects
            </h1>

            <p className="mt-1 text-gray-500">
              Manage and track all your projects.
            </p>
          </div>

          <button
            onClick={() =>
              setShowModal(true)
            }
            className="rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white transition hover:bg-gray-800"
          >
            + New Project
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
                  setSearchQuery(
                    e.target.value
                  )
                }
                placeholder="Search projects..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="project-status-filter"
                className="text-sm font-medium text-gray-600"
              >
                Status:
              </label>

              <select
                id="project-status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="All">
                  All
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
                {filteredProjects.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {projects.length}
              </span>{" "}
              projects
            </p>
          )}
        </section>

        {/* Projects */}
        <section className="p-10">
          {loading ? (
            <p className="text-gray-500">
              Loading projects...
            </p>
          ) : projects.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                No projects yet
              </h2>

              <p className="mt-2 text-gray-500">
                Create your first project to get started.
              </p>

              <button
                onClick={() =>
                  setShowModal(true)
                }
                className="mt-5 rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800"
              >
                + Create Project
              </button>
            </div>
          ) : filteredProjects.length ===
            0 ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                No matching projects
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
              {filteredProjects.map(
                (project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    description={
                      project.description
                    }
                    progress={
                      project.progress
                    }
                    status={project.status}
                    onDelete={
                      deleteProject
                    }
                    onEdit={() =>
                      openEditModal(
                        project
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* Create Project Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Create New Project
                </h2>

                <button
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="text-2xl text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Project Name
                  </label>

                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) =>
                      setProjectName(
                        e.target.value
                      )
                    }
                    placeholder="Enter project name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    placeholder="Describe your project"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={createProject}
                  className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Project
                </h2>

                <button
                  onClick={() =>
                    setEditingProject(
                      null
                    )
                  }
                  className="text-2xl text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Project Name
                  </label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) =>
                      setEditName(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>

                  <textarea
                    value={editDescription}
                    onChange={(e) =>
                      setEditDescription(
                        e.target.value
                      )
                    }
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Progress:{" "}
                    {editProgress}%
                  </label>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => {
                      const value =
                        Number(
                          e.target.value
                        );

                      setEditProgress(
                        value
                      );

                      if (value === 100) {
                        setEditStatus(
                          "Completed"
                        );
                      } else {
                        setEditStatus(
                          "In Progress"
                        );
                      }
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    value={editStatus}
                    onChange={(e) => {
                      const status =
                        e.target.value as
                          | "In Progress"
                          | "Completed";

                      setEditStatus(
                        status
                      );

                      if (
                        status ===
                        "Completed"
                      ) {
                        setEditProgress(
                          100
                        );
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
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
                  onClick={
                    updateProject
                  }
                  className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
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

