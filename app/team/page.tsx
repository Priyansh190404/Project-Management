"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";
import Sidebar from "../components/Sidebar";

type Person = {
  id: string;
  name: string;
  email: string;
  joinedAt?: string;
};

type Invite = {
  id: number;
  email: string;
  createdAt: string;
};

type TeamProject = {
  id: number;
  name: string;
  status: string;
  isOwner: boolean;
  owner: Person | null;
  members: Person[];
  invites: Invite[];
};

type TeamResponse = {
  currentUserId: string;
  projects: TeamProject[];
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
    >
      {initials(name)}
    </span>
  );
}

export default function TeamPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [data, setData] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [emails, setEmails] = useState<Record<number, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    try {
      const response = await fetch("/api/team", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Failed to load team");
      }

      setData(await response.json());
      setLoadError("");
    } catch (error) {
      console.error(error);
      setLoadError("We could not load your team. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session?.user) {
      router.replace("/sign-in");
      return;
    }

    loadTeam();
  }, [isPending, session, router, loadTeam]);

  async function request(
    key: string,
    method: "POST" | "DELETE",
    body: Record<string, unknown>,
    onSuccess: (result: Record<string, string>) => string
  ) {
    setBusyKey(key);
    setNotice(null);

    try {
      const response = await fetch("/api/team", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setNotice({ type: "error", text: result.error || "Something went wrong. Please try again." });
        return false;
      }

      setNotice({ type: "success", text: onSuccess(result) });
      await loadTeam();
      return true;
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", text: "Something went wrong. Please try again." });
      return false;
    } finally {
      setBusyKey(null);
    }
  }

  async function invite(event: React.FormEvent, project: TeamProject) {
    event.preventDefault();

    const email = (emails[project.id] || "").trim();

    if (!email) {
      return;
    }

    const ok = await request(
      `invite-${project.id}`,
      "POST",
      { projectId: project.id, email },
      (result) =>
        result.status === "added"
          ? `${result.name || email} was added to ${project.name}.`
          : `${email} will get access to ${project.name} when they sign up or sign in.`
    );

    if (ok) {
      setEmails((current) => ({ ...current, [project.id]: "" }));
    }
  }

  function removeMember(project: TeamProject, person: Person) {
    if (!window.confirm(`Remove ${person.name} from ${project.name}? Their assigned tasks will become unassigned.`)) {
      return;
    }

    request(
      `member-${project.id}-${person.id}`,
      "DELETE",
      { projectId: project.id, userId: person.id },
      () => `${person.name} was removed from ${project.name}.`
    );
  }

  function cancelInvite(pending: Invite) {
    request(
      `invite-cancel-${pending.id}`,
      "DELETE",
      { inviteId: pending.id },
      () => `Invitation for ${pending.email} was cancelled.`
    );
  }

  function leaveProject(project: TeamProject) {
    if (!data) {
      return;
    }

    if (!window.confirm(`Leave ${project.name}? You will lose access to its tasks and documents.`)) {
      return;
    }

    request(
      `leave-${project.id}`,
      "DELETE",
      { projectId: project.id, userId: data.currentUserId },
      () => `You left ${project.name}.`
    );
  }

  if (isPending || !session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Checking authentication...</p>
      </main>
    );
  }

  const owned = data?.projects.filter((project) => project.isOwner) ?? [];
  const shared = data?.projects.filter((project) => !project.isOwner) ?? [];

  const collaborators = new Set<string>();
  owned.forEach((project) => project.members.forEach((member) => collaborators.add(member.id)));
  shared.forEach((project) => {
    if (project.owner) {
      collaborators.add(project.owner.id);
    }
    project.members.forEach((member) => {
      if (member.id !== session.user.id) {
        collaborators.add(member.id);
      }
    });
  });

  return (
    <main className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="min-h-screen lg:ml-64">
        <header className="border-b bg-white px-4 py-4 sm:px-8 sm:py-5">
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="mt-1 text-gray-500">
            Invite people to your projects and see who you work with.
          </p>
        </header>

        <section className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-10">
          {notice && (
            <p
              role={notice.type === "error" ? "alert" : "status"}
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {notice.text}
            </p>
          )}

          {loading ? (
            <p className="text-gray-500">Loading your team...</p>
          ) : loadError ? (
            <div className="rounded-xl bg-white p-6 text-center shadow-sm sm:p-10">
              <p className="text-gray-700">{loadError}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  loadTeam();
                }}
                className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          ) : data && data.projects.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center shadow-sm sm:p-10">
              <h2 className="text-xl font-semibold text-gray-900">No projects yet</h2>
              <p className="mt-2 text-gray-500">
                Create a project first, then invite people to work on it with you.
              </p>
              <a
                href="/projects?new=true"
                className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
              >
                Create a project
              </a>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                  <p className="text-sm text-gray-500">Your projects</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{owned.length}</p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                  <p className="text-sm text-gray-500">Shared with you</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{shared.length}</p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                  <p className="text-sm text-gray-500">People</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{collaborators.size}</p>
                </div>
              </div>

              {owned.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-gray-900">Your projects</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Members can create and edit tasks, use the AI tools and add documents. Only you can edit or delete the project.
                  </p>

                  <div className="mt-5 space-y-6">
                    {owned.map((project) => {
                      const inviting = busyKey === `invite-${project.id}`;

                      return (
                        <article
                          key={project.id}
                          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <a
                              href={`/projects/${project.id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                            >
                              {project.name}
                            </a>
                            <span className="text-sm text-gray-500">
                              {project.members.length + 1}{" "}
                              {project.members.length + 1 === 1 ? "person" : "people"}
                            </span>
                          </div>

                          <ul className="mt-5 divide-y divide-gray-100">
                            <li className="flex items-center gap-3 py-3">
                              <Avatar name={project.owner?.name || "You"} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-gray-900">
                                  {project.owner?.name} (you)
                                </p>
                                <p className="truncate text-sm text-gray-500">{project.owner?.email}</p>
                              </div>
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                Owner
                              </span>
                            </li>

                            {project.members.map((member) => (
                              <li key={member.id} className="flex items-center gap-3 py-3">
                                <Avatar name={member.name} />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-gray-900">{member.name}</p>
                                  <p className="truncate text-sm text-gray-500">{member.email}</p>
                                </div>
                                <span className="hidden rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 sm:inline">
                                  Member
                                </span>
                                <button
                                  onClick={() => removeMember(project, member)}
                                  disabled={busyKey === `member-${project.id}-${member.id}`}
                                  aria-label={`Remove ${member.name} from ${project.name}`}
                                  className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  Remove
                                </button>
                              </li>
                            ))}

                            {project.invites.map((pending) => (
                              <li key={pending.id} className="flex items-center gap-3 py-3">
                                <span
                                  aria-hidden="true"
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400"
                                >
                                  @
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-gray-700">{pending.email}</p>
                                  <p className="text-sm text-gray-500">Waiting for them to sign up</p>
                                </div>
                                <span className="hidden rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 sm:inline">
                                  Invited
                                </span>
                                <button
                                  onClick={() => cancelInvite(pending)}
                                  disabled={busyKey === `invite-cancel-${pending.id}`}
                                  aria-label={`Cancel invitation for ${pending.email}`}
                                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </li>
                            ))}
                          </ul>

                          <form
                            onSubmit={(event) => invite(event, project)}
                            className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row"
                          >
                            <label htmlFor={`invite-email-${project.id}`} className="sr-only">
                              Email address to invite to {project.name}
                            </label>
                            <input
                              id={`invite-email-${project.id}`}
                              type="email"
                              inputMode="email"
                              autoComplete="off"
                              value={emails[project.id] || ""}
                              onChange={(event) =>
                                setEmails((current) => ({ ...current, [project.id]: event.target.value }))
                              }
                              placeholder="teammate@example.com"
                              required
                              className="w-full flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                            />
                            <button
                              type="submit"
                              disabled={inviting}
                              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {inviting ? "Inviting..." : "Invite"}
                            </button>
                          </form>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {shared.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-gray-900">Shared with you</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Projects other people invited you to.
                  </p>

                  <div className="mt-5 space-y-6">
                    {shared.map((project) => (
                      <article
                        key={project.id}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <a
                              href={`/projects/${project.id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                            >
                              {project.name}
                            </a>
                            <p className="text-sm text-gray-500">Owned by {project.owner?.name}</p>
                          </div>

                          <button
                            onClick={() => leaveProject(project)}
                            disabled={busyKey === `leave-${project.id}`}
                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            Leave project
                          </button>
                        </div>

                        <ul className="mt-5 divide-y divide-gray-100">
                          {[
                            ...(project.owner ? [{ ...project.owner, role: "Owner" }] : []),
                            ...project.members.map((member) => ({
                              ...member,
                              role: "Member",
                            })),
                          ].map((person) => (
                            <li key={person.id} className="flex items-center gap-3 py-3">
                              <Avatar name={person.name} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-gray-900">
                                  {person.name}
                                  {person.id === session.user.id ? " (you)" : ""}
                                </p>
                                <p className="truncate text-sm text-gray-500">{person.email}</p>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  person.role === "Owner"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {person.role}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
