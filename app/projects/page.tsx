"use client";

import { useEffect, useState } from "react";
import ProjectCard from "../components/ProjectCard";

type Project = {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: string;
  createdAt: string;
};

export default function ProjectsPage() {
  const [showModal, setShowModal] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects");

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  }
  async function deleteProject(id: number) {
  try {
    const response = await fetch("/api/projects", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete project");
    }

    await fetchProjects();
  } catch (error) {
    console.error("Error deleting project:", error);
  }
}

  async function createProject() {
    if (!projectName.trim()) {
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          description: description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const newProject = await response.json();

      setProjects((currentProjects) => [
        ...currentProjects,
        newProject,
      ]);

      setProjectName("");
      setDescription("");
      setShowModal(false);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">

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
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          + New Project
        </button>
      </header>

      <section className="p-10">

        {loading ? (
          <p className="text-gray-500">
            Loading projects...
          </p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500">
            No projects yet. Create your first project.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {projects.map((project) => (
              <ProjectCard
  key={project.id}
  id={project.id}
  name={project.name}
  description={project.description}
  progress={project.progress}
  status={project.status}
  onDelete={deleteProject}
/>
            ))}

          </div>
        )}

      </section>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Create New Project
              </h2>

              <button
                onClick={() => setShowModal(false)}
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
                  onChange={(e) => setProjectName(e.target.value)}
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
                  onChange={(e) => setDescription(e.target.value)}
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

    </main>
  );
}