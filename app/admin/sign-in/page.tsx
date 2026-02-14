"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Status = "idle" | "loading" | "success" | "error";

export default function AdminSignInPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const continueAsAdmin = async (user: User) => {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const role = userDoc.exists() ? userDoc.data().role : null;

    if (role !== "admin") {
      setStatus("error");
      setError("This account is not registered as an admin.");
      return;
    }

    router.push("/admin");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSessionUser(user);
      setCheckingSession(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setStatus("error");
      setError("Please enter your email and password.");
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      setStatus("success");
      await continueAsAdmin(credential.user);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.";
      setStatus("error");
      setError(message);
    }
  };

  const handleGoogleSignIn = async () => {
    setStatus("loading");
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      await continueAsAdmin(credential.user);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed.";
      setStatus("error");
      setError(message);
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--prime-ink)]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
            Admin sign in
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Access Prime Care admin dashboard.
          </h1>
          <p className="max-w-xl text-sm text-[color:rgba(20,21,22,0.7)]">
            Sign in with an admin account to review provider applications.
          </p>
        </header>

        <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,42,34,0.12)]">
          {checkingSession ? (
            <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
              Checking session...
            </p>
          ) : sessionUser ? (
            <div className="space-y-5">
              <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                You are signed in as <strong>{sessionUser.email}</strong>.
              </p>
              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => continueAsAdmin(sessionUser)}
                  className="rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)]"
                >
                  Continue to dashboard
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut(auth);
                    setSessionUser(null);
                    setError(null);
                  }}
                  className="rounded-full border border-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                >
                  Switch account
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Email address
                <input
                  name="email"
                  type="email"
                  placeholder="admin@primecare.com"
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)]"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Password
                <input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)]"
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading" ? "Signing in..." : "Sign in"}
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={status === "loading"}
                className="w-full rounded-full border border-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                Continue with Google
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/"
            className="font-semibold uppercase tracking-[0.2em] text-[var(--prime-copper)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
