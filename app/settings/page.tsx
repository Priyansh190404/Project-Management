"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";
import Sidebar from "../components/Sidebar";

const SKIP_WELCOME_KEY = "taskflow:skip-welcome";

type Message = { type: "success" | "error"; text: string } | null;

type DeviceSession = {
  token: string;
  createdAt: Date | string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

const primaryButton =
  "rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

function describeDevice(userAgent?: string | null) {
  if (!userAgent) {
    return "Unknown device";
  }

  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\/|Opera/.test(userAgent)
      ? "Opera"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Browser";

  const system = /iPhone|iPad/.test(userAgent)
    ? "iOS"
    : /Android/.test(userAgent)
      ? "Android"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "Unknown system";

  return `${browser} on ${system}`;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Section({
  title,
  description,
  children,
  danger = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-7 ${
        danger ? "border-red-200" : "border-gray-200"
      }`}
    >
      <h2 className={`text-xl font-bold ${danger ? "text-red-700" : "text-gray-900"}`}>
        {title}
      </h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Feedback({ message }: { message: Message }) {
  if (!message) {
    return null;
  }

  return (
    <p
      role={message.type === "error" ? "alert" : "status"}
      className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
        message.type === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {message.text}
    </p>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // Profile
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<Message>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<Message>(null);

  // Devices
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesMessage, setDevicesMessage] = useState<Message>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Preferences
  const [showWelcome, setShowWelcome] = useState(true);

  // Delete account
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<Message>(null);

  const userId = session?.user?.id;
  const currentToken = session?.session?.token;

  const loadDevices = useCallback(async () => {
    try {
      const result = await authClient.listSessions();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setDevices((result.data ?? []) as DeviceSession[]);
      setDevicesMessage(null);
    } catch (error) {
      console.error(error);
      setDevicesMessage({ type: "error", text: "We could not load your signed-in devices." });
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!userId) {
      router.replace("/sign-in");
      return;
    }

    loadDevices();
  }, [isPending, userId, router, loadDevices]);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    try {
      setShowWelcome(localStorage.getItem(SKIP_WELCOME_KEY) !== "1");
    } catch {
      setShowWelcome(true);
    }
  }, []);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = name.trim();

    if (!trimmed) {
      setProfileMessage({ type: "error", text: "Name cannot be empty." });
      return;
    }

    setSavingProfile(true);
    setProfileMessage(null);

    const result = await authClient.updateUser({ name: trimmed });

    setSavingProfile(false);

    if (result.error) {
      setProfileMessage({
        type: "error",
        text: result.error.message || "Could not update your profile.",
      });
      return;
    }

    setProfileMessage({ type: "success", text: "Your name was updated." });
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "The new passwords do not match." });
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordMessage({ type: "error", text: "Choose a password you have not used here before." });
      return;
    }

    setSavingPassword(true);
    setPasswordMessage(null);

    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    setSavingPassword(false);

    if (result.error) {
      setPasswordMessage({
        type: "error",
        text: result.error.message || "Could not change your password. Check your current password.",
      });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage({
      type: "success",
      text: "Password changed. You were signed out on your other devices.",
    });
    loadDevices();
  }

  async function revokeDevice(token: string) {
    setRevoking(token);
    setDevicesMessage(null);

    const result = await authClient.revokeSession({ token });

    setRevoking(null);

    if (result.error) {
      setDevicesMessage({ type: "error", text: "Could not sign out that device." });
      return;
    }

    setDevicesMessage({ type: "success", text: "Device signed out." });
    loadDevices();
  }

  async function revokeOthers() {
    if (!window.confirm("Sign out of every device except this one?")) {
      return;
    }

    setRevoking("others");
    setDevicesMessage(null);

    const result = await authClient.revokeOtherSessions();

    setRevoking(null);

    if (result.error) {
      setDevicesMessage({ type: "error", text: "Could not sign out your other devices." });
      return;
    }

    setDevicesMessage({ type: "success", text: "Signed out of all other devices." });
    loadDevices();
  }

  function updateShowWelcome(value: boolean) {
    setShowWelcome(value);

    try {
      if (value) {
        localStorage.removeItem(SKIP_WELCOME_KEY);
      } else {
        localStorage.setItem(SKIP_WELCOME_KEY, "1");
      }
    } catch {
      // Storage can be unavailable (private mode); the setting just will not persist
    }
  }

  async function deleteAccount(event: React.FormEvent) {
    event.preventDefault();

    setDeleting(true);
    setDeleteMessage(null);

    const result = await authClient.deleteUser({ password: deletePassword });

    if (result.error) {
      setDeleting(false);
      setDeleteMessage({
        type: "error",
        text: result.error.message || "Could not delete your account. Check your password.",
      });
      return;
    }

    window.location.href = "/signup";
  }

  if (isPending || !session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Checking authentication...</p>
      </main>
    );
  }

  const profileChanged = name.trim() !== session.user.name;
  const otherDevices = devices.filter((device) => device.token !== currentToken);

  return (
    <main className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="min-h-screen lg:ml-64">
        <header className="border-b bg-white px-4 py-4 sm:px-8 sm:py-5">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-gray-500">Manage your account, security and data.</p>
        </header>

        <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-10">
          <Section title="Profile" description="This is how you appear to the people you work with.">
            <Feedback message={profileMessage} />

            <form onSubmit={saveProfile} className="space-y-5">
              <div>
                <label htmlFor="settings-name" className={labelClass}>
                  Name
                </label>
                <input
                  id="settings-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="settings-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="settings-email"
                  type="email"
                  value={session.user.email}
                  disabled
                  className={inputClass}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Your email is how teammates invite you and cannot be changed here.
                </p>
              </div>

              <button type="submit" disabled={savingProfile || !profileChanged} className={primaryButton}>
                {savingProfile ? "Saving..." : "Save changes"}
              </button>
            </form>
          </Section>

          <Section
            title="Password"
            description="Use at least 8 characters. Changing it signs you out everywhere else."
          >
            <Feedback message={passwordMessage} />

            <form onSubmit={savePassword} className="space-y-5">
              <div>
                <label htmlFor="current-password" className={labelClass}>
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-password" className={labelClass}>
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={8}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className={labelClass}>
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <button type="submit" disabled={savingPassword} className={primaryButton}>
                {savingPassword ? "Changing..." : "Change password"}
              </button>
            </form>
          </Section>

          <Section
            title="Signed-in devices"
            description="Everywhere your account is currently signed in. Sign out of any you do not recognise."
          >
            <Feedback message={devicesMessage} />

            {devicesLoading ? (
              <p className="text-gray-500">Loading devices...</p>
            ) : (
              <>
                <ul className="divide-y divide-gray-100">
                  {devices.map((device) => {
                    const isCurrent = device.token === currentToken;

                    return (
                      <li key={device.token} className="flex flex-wrap items-center gap-3 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">
                            {describeDevice(device.userAgent)}
                            {isCurrent && (
                              <span className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                This device
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Signed in {formatDate(device.createdAt)}
                            {device.ipAddress ? ` · ${device.ipAddress}` : ""}
                          </p>
                        </div>

                        {!isCurrent && (
                          <button
                            onClick={() => revokeDevice(device.token)}
                            disabled={revoking === device.token}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                          >
                            {revoking === device.token ? "Signing out..." : "Sign out"}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {otherDevices.length > 0 && (
                  <button
                    onClick={revokeOthers}
                    disabled={revoking === "others"}
                    className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {revoking === "others" ? "Signing out..." : "Sign out all other devices"}
                  </button>
                )}
              </>
            )}
          </Section>

          <Section title="Preferences" description="Small things that make TaskFlow feel the way you want. Saved in this browser.">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={showWelcome}
                onChange={(event) => updateShowWelcome(event.target.checked)}
                className="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 accent-blue-600"
              />
              <span>
                <span className="block font-medium text-gray-900">Show the welcome page after I sign in</span>
                <span className="block text-sm text-gray-500">
                  Turn this off to go straight to your dashboard.
                </span>
              </span>
            </label>
          </Section>

          <Section
            title="Your data"
            description="Download your projects, tasks and documents as a JSON file."
          >
            <a href="/api/account/export" download className={`inline-block ${primaryButton}`}>
              Download my data
            </a>
          </Section>

          <Section
            danger
            title="Delete account"
            description="This permanently deletes your account, your projects, their tasks and documents, and removes any teammates' access to them. Projects other people shared with you are not affected."
          >
            <Feedback message={deleteMessage} />

            <form onSubmit={deleteAccount} className="space-y-5">
              <div>
                <label htmlFor="delete-password" className={labelClass}>
                  Your password
                </label>
                <input
                  id="delete-password"
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="delete-confirm" className={labelClass}>
                  Type DELETE to confirm
                </label>
                <input
                  id="delete-confirm"
                  type="text"
                  autoComplete="off"
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={deleting || deleteConfirmation !== "DELETE" || !deletePassword}
                className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete my account"}
              </button>
            </form>
          </Section>
        </div>
      </div>
    </main>
  );
}
