"use client";

import { useEffect, useState } from "react";
import StatCard from "./components/StatCard";
import ProjectCard from "./components/ProjectCard";

type Project = {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: "In Progress" | "Completed";
  createdAt: string;
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetchProjects();

  const handleFocus = () => {
    fetchProjects();
  };

  window.addEventListener("focus", handleFocus);

  return () => {
    window.removeEventListener("focus", handleFocus);
  };
}, []);

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects", {
        cache: "no-store",
      });

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

  return (
    <main className="min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white">

        {/* Logo */}
        <div className="flex h-20 items-center border-b border-gray-800 px-6">
          <h1 className="text-2xl font-bold">
            TaskFlow
          </h1>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">

          {/* Dashboard */}
          <a
            href="/"
            className="mb-2 block rounded-lg bg-gray-800 px-4 py-3 font-medium text-white"
          >
            Dashboard
          </a>

          {/* Projects */}
          <a
            href="/projects"
            className="mb-2 block rounded-lg px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Projects
          </a>

          {/* Tasks */}
          <a
            href="/tasks"
            className="mb-2 block rounded-lg px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Tasks
          </a>

          {/* Team */}
          <a
            href="#"
            className="mb-2 block rounded-lg px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Team
          </a>

          {/* Settings */}
          <a
            href="#"
            className="mb-2 block rounded-lg px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Settings
          </a>

        </nav>

        {/* User section */}
        <div className="absolute bottom-0 w-full border-t border-gray-800 p-5">
          <p className="font-medium">
            Priyansh
          </p>

          <p className="text-sm text-gray-400">
            Software Developer
          </p>
        </div>

      </aside>

      {/* Main area */}
      <div className="ml-64 min-h-screen">

        {/* Top bar */}
        <header className="flex h-20 items-center justify-between border-b bg-white px-8">

          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Dashboard
            </h2>

            <p className="text-sm text-gray-500">
              Welcome back to TaskFlow
            </p>
          </div>

          {/* New Project */}
          <a
            href="/projects?new=true"
            className="rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white hover:bg-gray-800"
          >
            + New Project
          </a>

        </header>

        {/* Main content */}
        <section className="p-10">

          <h2 className="text-4xl font-bold text-gray-900">
            Manage your projects and tasks.
          </h2>

          <p className="mt-3 text-lg text-gray-600">
            Collaborate with your team and get work done efficiently.
          </p>

          {/* Statistics */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

            <StatCard
              title="Projects"
              value={projects.length}
            />

            <StatCard
              title="Tasks"
              value={24}
            />

            <StatCard
              title="In Progress"
              value={
                projects.filter(
                  (project) => project.status === "In Progress"
                ).length
              }
            />

            <StatCard
              title="Completed"
              value={
                projects.filter(
                  (project) => project.status === "Completed"
                ).length
              }
            />

          </div>

          {/* Recent Projects */}
          <div className="mt-10">

            <div className="flex items-center justify-between">

              <h3 className="text-2xl font-bold text-gray-900">
                Recent Projects
              </h3>

              {/* View All */}
              <a
                href="/projects"
                className="font-medium text-gray-700 hover:text-gray-900"
              >
                View all →
              </a>

            </div>

            {/* Projects */}
            {loading ? (

              <p className="mt-5 text-gray-500">
                Loading projects...
              </p>

            ) : projects.length === 0 ? (

              <div className="mt-5 rounded-xl bg-white p-8 shadow">
                <p className="text-gray-500">
                  No projects yet.
                </p>

                <a
                  href="/projects"
                  className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Create your first project
                </a>
              </div>

            ) : (

              <div className="mt-5 grid gap-6 md:grid-cols-2">

                {projects.slice(0, 2).map((project) => (

                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    description={project.description}
                    progress={project.progress}
                    status={project.status}
                  />

                ))}

              </div>

            )}

          </div>

        </section>

      </div>

    </main>
  );
}