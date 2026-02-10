"use client";

import { useRouter } from "next/navigation";

export default function ProviderAuthPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--prime-ink)]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
            Provider access
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Sign in or create a provider account.
          </h1>
          <p className="max-w-xl text-sm text-[color:rgba(20,21,22,0.7)]">
            Create your provider profile to begin onboarding, or sign in to
            continue where you left off.
          </p>
        </header>

        <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,42,34,0.12)]">
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => router.push("/provider/sign-up")}
              className="rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)]"
            >
              Create provider account
            </button>
            <button
              onClick={() => router.push("/provider/sign-in")}
              className="rounded-full border border-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
            >
              Sign in
            </button>
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--prime-copper)]"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
