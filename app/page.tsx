"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "./lib/auth-client";
import StatCard from "./components/StatCard";
import ProjectCard from "./components/ProjectCard";
import Sidebar from "./components/Sidebar";

type Project = {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: "In Progress" | "Completed";
  createdAt: string;
};

type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
  projectId: number;
  createdAt: string;
};

export default function Home() {
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session?.user) {
      router.replace("/sign-in");
      return;
    }

    fetchDashboardData();

    const handleFocus = () => {
      fetchDashboardData();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isPending, session, router]);

  async function fetchDashboardData() {
    try {
      const [projectsResponse, tasksResponse] = await Promise.all([
        fetch("/api/projects", {
          cache: "no-store",
        }),
        fetch("/api/tasks", {
          cache: "no-store",
        }),
      ]);

      if (!projectsResponse.ok) {
        throw new Error("Failed to fetch projects");
      }

      if (!tasksResponse.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const projectsData = await projectsResponse.json();
      const tasksData = await tasksResponse.json();

      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

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

      {/* Main area */}
      <div className="ml-64 min-h-screen">
        {/* Top bar */}
        <header className="flex h-20 items-center justify-between border-b bg-white px-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Dashboard
            </h2>

            <p className="text-sm text-gray-500">
              Welcome back,{" "}
              {session.user.name || session.user.email}
            </p>
          </div>

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
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
  <StatCard
    title="Projects"
    value={projects.length}
  />

  <StatCard
    title="Tasks"
    value={tasks.length}
  />

  <StatCard
    title="To Do"
    value={
      tasks.filter(
        (task) => task.status === "To Do"
      ).length
    }
  />

  <StatCard
    title="In Progress"
    value={
      tasks.filter(
        (task) => task.status === "In Progress"
      ).length
    }
  />

  <StatCard
    title="Completed"
    value={
      tasks.filter(
        (task) => task.status === "Completed"
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

              <a
                href="/projects"
                className="font-medium text-gray-700 hover:text-gray-900"
              >
                View all →
              </a>
            </div>

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
                  href="/projects?new=true"
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