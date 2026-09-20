"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-gray-800 px-6">
        <h1 className="text-2xl font-bold">
          TaskFlow
        </h1>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-4">
        <Link
          href="/"
          className={`mb-2 block rounded-lg px-4 py-3 font-medium ${
            isActive("/")
              ? "bg-gray-800 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Dashboard
        </Link>

        <Link
          href="/projects"
          className={`mb-2 block rounded-lg px-4 py-3 font-medium ${
            isActive("/projects")
              ? "bg-gray-800 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Projects
        </Link>

        <Link
          href="/tasks"
          className={`mb-2 block rounded-lg px-4 py-3 font-medium ${
            isActive("/tasks")
              ? "bg-gray-800 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Tasks
        </Link>

        <div className="mb-2 block rounded-lg px-4 py-3 text-gray-600">
          Team
        </div>

        <div className="mb-2 block rounded-lg px-4 py-3 text-gray-600">
          Settings
        </div>
      </nav>

      {/* User section */}
      <div className="absolute bottom-0 w-full border-t border-gray-800 p-5">
        <p className="font-medium">
          TaskFlow User
        </p>

        <p className="text-sm text-gray-400">
          Software Developer
        </p>

        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}