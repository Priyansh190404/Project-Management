import StatCard from "./components/StatCard";
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="flex items-center justify-between bg-white px-8 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          TaskFlow
        </h1>

        <div className="flex gap-6">
          <a href="#" className="text-gray-600 hover:text-gray-900">
            Dashboard
          </a>

          <a href="#" className="text-gray-600 hover:text-gray-900">
            Login
          </a>
        </div>
      </nav>

      {/* Main content */}
      <section className="p-10">
        <h2 className="text-4xl font-bold text-gray-900">
          Manage your projects and tasks.
        </h2>

        <p className="mt-3 text-lg text-gray-600">
          Collaborate with your team and get work done efficiently.
        </p>
        

  <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
  <StatCard title="Projects" value={4} />
  <StatCard title="Tasks" value={24} />
  <StatCard title="In Progress" value={8} />
  <StatCard title="Completed" value={16} />
</div>
<div className="mt-10">
  <h3 className="text-2xl font-bold text-gray-900">
    Recent Projects
  </h3>

  <div className="mt-5 grid gap-6 md:grid-cols-2">
    
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h4 className="text-xl font-semibold text-gray-900">
        E-Commerce Platform
      </h4>

      <p className="mt-2 text-gray-500">
        Building a full-stack online shopping platform.
      </p>
<div className="mt-5">
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">Progress</span>
    <span className="font-medium text-gray-700">60%</span>
  </div>

  <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
    <div className="h-2 w-[60%] rounded-full bg-blue-600"></div>
  </div>
</div>
    </div>

    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h4 className="text-xl font-semibold text-gray-900">
        Mobile Banking App
      </h4>

      <p className="mt-2 text-gray-500">
        Designing the next generation banking experience.
      </p>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          20 / 20 tasks
        </span>

        <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
          Completed
        </span>
      </div>
    </div>

  </div>
</div>
      </section>

    </main>
  );
}