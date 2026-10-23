"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "../lib/auth-client";
import AuthShell, {
  authButtonClass,
  authErrorClass,
  authInputClass,
  authLabelClass,
} from "../components/AuthShell";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      setError(result.error.message || "Invalid email or password.");
      setLoading(false);
      return;
    }

    setLoading(false);

    // Signed-in users land on the welcome page first, unless they chose to skip it
    let skipWelcome = false;

    try {
      skipWelcome = localStorage.getItem("taskflow:skip-welcome") === "1";
    } catch {
      skipWelcome = false;
    }

    window.location.href = skipWelcome ? "/" : "/welcome";
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to TaskFlow."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignIn} className="space-y-5">
        <div>
          <label htmlFor="email" className={authLabelClass}>
            Email
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            className={authInputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={authLabelClass}>
            Password
          </label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
            className={authInputClass}
          />
        </div>

        {error && (
          <p role="alert" className={authErrorClass}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
