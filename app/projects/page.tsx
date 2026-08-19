"use client";
import ProjectCard from "../components/ProjectCard";

export default function ProjectsPage() {
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
  onClick={() => console.log("BUTTON CLICKED")}
  className="bg-red-500 p-5 text-2xl text-white"
>
  CLICK ME
</button>
      </header>

      <section className="p-10">

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          <ProjectCard
            name="E-Commerce Platform"
            description="Building a full-stack online shopping platform."
            progress={60}
            status="In Progress"
          />

          <ProjectCard
            name="Mobile Banking App"
            description="Designing the next generation banking experience."
            progress={100}
            status="Completed"
          />

          <ProjectCard
            name="TaskFlow"
            description="Building a modern project management SaaS."
            progress={35}
            status="In Progress"
          />

        </div>

      </section>

    </main>
  );
}