"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";
import Logo from "../components/Logo";

const SKIP_KEY = "taskflow:skip-welcome";

type Summary = {
  projects: number;
  openTasks: number;
};

const starts = [
  {
    href: "/projects?new=true",
    title: "Plan a project with AI",
    description: "Describe your idea and get a project with tasks and a plan.",
  },
  {
    href: "/tasks",
    title: "Review your tasks",
    description: "See what is in progress, what is blocked and what is done.",
  },
  {
    href: "/projects",
    title: "Browse your projects",
    description: "Open a project to see its tasks, insights and documents.",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [skipNextTime, setSkipNextTime] = useState(false);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session?.user) {
      router.replace("/sign-in");
      return;
    }

    try {
      setSkipNextTime(localStorage.getItem(SKIP_KEY) === "1");
    } catch {
      setSkipNextTime(false);
    }

    let cancelled = false;

    async function loadSummary() {
      try {
        const [projectsResponse, tasksResponse] = await Promise.all([
          fetch("/api/projects", { cache: "no-store" }),
          fetch("/api/tasks", { cache: "no-store" }),
        ]);

        if (!projectsResponse.ok || !tasksResponse.ok) {
          return;
        }

        const projects = await projectsResponse.json();
        const tasks: { status: string }[] = await tasksResponse.json();

        if (!cancelled) {
          setSummary({
            projects: projects.length,
            openTasks: tasks.filter((task) => task.status !== "Completed").length,
          });
        }
      } catch (error) {
        console.error("Error loading welcome summary:", error);
      }
    }

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [isPending, session, router]);

  function updateSkip(value: boolean) {
    setSkipNextTime(value);

    try {
      if (value) {
        localStorage.setItem(SKIP_KEY, "1");
      } else {
        localStorage.removeItem(SKIP_KEY);
      }
    } catch {
      // Storage can be unavailable (private mode); the page still works without it
    }
  }

  if (isPending || !session?.user) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950">
        <p className="text-slate-400">Getting your workspace ready...</p>
      </main>
    );
  }

  const firstName = (session.user.name || session.user.email || "").split(/[\s@]/)[0];

  let summaryText = "";

  if (summary) {
    summaryText =
      summary.projects === 0
        ? "Your workspace is empty. Pick a starting point below."
        : `You have ${summary.projects} ${summary.projects === 1 ? "project" : "projects"} and ${summary.openTasks} open ${summary.openTasks === 1 ? "task" : "tasks"}.`;
  }

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
        <Logo />

        <Link
          href="/"
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"
        >
          Skip to dashboard
        </Link>
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 pb-16 pt-8 sm:px-8 sm:pt-16">
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Welcome to TaskFlow, {firstName}.
        </h1>

        <p className="mt-4 min-h-7 text-lg text-slate-400">
          {summaryText || "Here is where you can start."}
        </p>

        <ul className="mt-10 divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          {starts.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center justify-between gap-4 px-5 py-5 transition hover:bg-slate-900 sm:px-6"
              >
                <span>
                  <span className="block font-display text-lg font-semibold text-white">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-sm text-slate-400">
                    {item.description}
                  </span>
                </span>

                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-blue-400"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col-reverse gap-5 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={skipNextTime}
              onChange={(event) => updateSkip(event.target.checked)}
              className="h-5 w-5 cursor-pointer rounded border-slate-600 bg-slate-800 accent-blue-600"
            />
            Skip this page after I sign in
          </label>

          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-blue-500"
          >
            Continue to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
