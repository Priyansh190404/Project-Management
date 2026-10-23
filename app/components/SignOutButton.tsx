"use client";

import { authClient } from "../lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/sign-in");
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
    >
      Sign Out
    </button>
  );
}