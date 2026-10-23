import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "./Logo";

export const authLabelClass = "mb-2 block text-sm font-medium text-slate-300";

export const authInputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400";

export const authButtonClass =
  "w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60";

export const authErrorClass =
  "rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400";

const highlights = [
  "Turn a project idea into tasks with AI",
  "See which tasks block which, with dependencies",
  "Ask questions about your project documents",
];

function FlowGraphic() {
  return (
    <svg
      viewBox="0 0 360 200"
      className="w-full max-w-md"
      fill="none"
      role="img"
      aria-label="Tasks connected by dependencies"
    >
      <g className="stroke-slate-600" strokeWidth="1.5" strokeLinecap="round">
        <path d="M96 52 C130 52 130 100 164 100" />
        <path d="M96 148 C130 148 130 100 164 100" />
        <path d="M252 100 C280 100 280 100 296 100" className="stroke-blue-400" />
      </g>

      <g className="fill-slate-800 stroke-slate-700" strokeWidth="1.5">
        <rect x="16" y="32" width="80" height="40" rx="10" />
        <rect x="16" y="128" width="80" height="40" rx="10" />
        <rect x="164" y="80" width="88" height="40" rx="10" className="stroke-purple-400" />
        <rect x="296" y="80" width="48" height="40" rx="10" className="fill-blue-600 stroke-blue-400" />
      </g>

      <g className="fill-slate-500">
        <rect x="30" y="46" width="44" height="4" rx="2" />
        <rect x="30" y="56" width="28" height="4" rx="2" />
        <rect x="30" y="142" width="38" height="4" rx="2" />
        <rect x="30" y="152" width="50" height="4" rx="2" />
        <rect x="180" y="94" width="56" height="4" rx="2" className="fill-purple-300" />
        <rect x="180" y="104" width="36" height="4" rx="2" className="fill-slate-500" />
      </g>

      <path
        d="M311 100.5l6 6 12-12"
        className="stroke-white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-dvh bg-slate-950 text-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
      {/* Brand panel: desktop only */}
      <aside className="hidden flex-col justify-between border-r border-slate-800 bg-slate-900 p-12 lg:flex xl:p-16">
        <Link href="/" aria-label="TaskFlow">
          <Logo />
        </Link>

        <div>
          <FlowGraphic />

          <h2 className="mt-10 max-w-md text-4xl font-bold leading-tight text-white">
            Plan projects with AI, then get them done.
          </h2>

          <ul className="mt-6 max-w-md space-y-3 text-slate-300">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-blue-400"
                >
                  <path d="M5 12.5l4.2 4.2L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-slate-500">
          Built with Next.js, Prisma and Google Gemini.
        </p>
      </aside>

      {/* Form */}
      <section className="flex min-h-dvh flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" aria-label="TaskFlow" className="mb-10 inline-block lg:hidden">
            <Logo />
          </Link>

          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-slate-400">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
        </div>
      </section>
    </main>
  );
}
