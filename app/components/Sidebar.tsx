"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-slate-950 text-white">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-800 px-6">
        <h1 className="text-2xl font-bold tracking-tight">
          TaskFlow
        </h1>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-4">
        <Link
          href="/"
          className={`mb-2 block rounded-lg px-4 py-3 text-sm font-medium transition ${
            isActive("/")
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          Dashboard
        </Link>

        <Link
          href="/projects"
          className={`mb-2 block rounded-lg px-4 py-3 text-sm font-medium transition ${
            isActive("/projects")
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          Projects
        </Link>

        <Link
          href="/tasks"
          className={`mb-2 block rounded-lg px-4 py-3 text-sm font-medium transition ${
            isActive("/tasks")
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          Tasks
        </Link>

        <div className="mb-2 block rounded-lg px-4 py-3 text-sm font-medium text-slate-700">
          Team
        </div>

        <div className="mb-2 block rounded-lg px-4 py-3 text-sm font-medium text-slate-700">
          Settings
        </div>
      </nav>

      {/* User section */}
      <div className="absolute bottom-0 w-full border-t border-slate-800 p-5">
        <p className="font-medium text-white">
          TaskFlow User
        </p>

        <p className="text-sm text-slate-400">
          Software Developer
        </p>

        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}