import StatCard from "./components/StatCard";
import ProjectCard from "./components/ProjectCard";

export default function Home() {
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

          <a
            href="#"
            className="mb-2 block rounded-lg bg-gray-800 px-4 py-3 font-medium text-white"
          >
            Dashboard
          </a>

          <a
            href="#"
            className="mb-2 block rounded-lg px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Projects
          </a>

          <a
            href="#"
            className="mb-2 block rounded-lg px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Tasks
          </a>

          <a
            href="#"
            className="mb-2 block rounded-lg px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Team
          </a>

          <a
            href="#"
            className="mb-2 block rounded-lg px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Settings
          </a>

        </nav>

        {/* User section */}
        <div className="absolute bottom-0 w-full border-t border-gray-800 p-5">
          <p className="font-medium">Priyansh</p>
          <p className="text-sm text-gray-400">Software Developer</p>
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

          <button className="rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white hover:bg-gray-800">
            + New Project
          </button>
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
            <StatCard title="Projects" value={4} />
            <StatCard title="Tasks" value={24} />
            <StatCard title="In Progress" value={8} />
            <StatCard title="Completed" value={16} />
          </div>

          {/* Recent Projects */}
          <div className="mt-10">

            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                Recent Projects
              </h3>

              <a
                href="#"
                className="font-medium text-gray-700 hover:text-gray-900"
              >
                View all →
              </a>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">

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

            </div>
          </div>

        </section>

      </div>

    </main>
  );
}