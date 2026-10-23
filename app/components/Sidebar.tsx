"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";
import Logo from "./Logo";
import { authClient } from "../lib/auth-client";

const icons = {
  dashboard: (
    <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />
  ),
  projects: (
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  ),
  tasks: <path d="M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9" />,
  team: (
    <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.87M16 4.13a3.5 3.5 0 0 1 0 6.74" />
  ),
  settings: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  ),
};

function Icon({ name }: { name: keyof typeof icons }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {icons[name]}
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  };

  // Close the drawer whenever the user navigates
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the drawer, and the page behind it does not scroll while it is open
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const linkClass = (path: string) =>
    `relative mb-1.5 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
      isActive(path)
        ? "bg-slate-800 text-white before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-0.5 before:rounded-full before:bg-blue-400"
        : "text-slate-400 hover:bg-slate-900 hover:text-white"
    }`;

  const userName = session?.user?.name || session?.user?.email || "TaskFlow User";
  const userEmail = session?.user?.name ? session.user.email : "";

  return (
    <>
      {/* Mobile top bar */}
      <header
        className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 lg:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Link href="/" aria-label="TaskFlow dashboard">
          <Logo />
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="app-sidebar"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-900 hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {/* Backdrop (mobile only) */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[1px] transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-950 text-white transition-[transform,visibility] duration-200 lg:visible lg:z-40 lg:w-64 lg:max-w-none lg:translate-x-0 ${
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5 lg:h-20 lg:px-6">
          <Link href="/" aria-label="TaskFlow dashboard">
            <Logo />
          </Link>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 overflow-y-auto px-4" aria-label="Main">
          <Link
            href="/"
            className={linkClass("/")}
            aria-current={isActive("/") ? "page" : undefined}
          >
            <Icon name="dashboard" />
            Dashboard
          </Link>

          <Link
            href="/projects"
            className={linkClass("/projects")}
            aria-current={isActive("/projects") ? "page" : undefined}
          >
            <Icon name="projects" />
            Projects
          </Link>

          <Link
            href="/tasks"
            className={linkClass("/tasks")}
            aria-current={isActive("/tasks") ? "page" : undefined}
          >
            <Icon name="tasks" />
            Tasks
          </Link>

          <Link
            href="/team"
            className={linkClass("/team")}
            aria-current={isActive("/team") ? "page" : undefined}
          >
            <Icon name="team" />
            Team
          </Link>

          <Link
            href="/settings"
            className={linkClass("/settings")}
            aria-current={isActive("/settings") ? "page" : undefined}
          >
            <Icon name="settings" />
            Settings
          </Link>
        </nav>

        {/* User section */}
        <div
          className="shrink-0 border-t border-slate-800 p-5"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          <p className="truncate font-medium text-white">{userName}</p>

          {userEmail && (
            <p className="truncate text-sm text-slate-400">{userEmail}</p>
          )}

          <div className="mt-4">
            <SignOutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
