"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Status = "idle" | "loading" | "success" | "error";

export default function ProviderSignInPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      if (!user.emailVerified) {
        setVerificationPending(true);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || "Provider",
          email: user.email || "",
          role: "provider",
          createdAt: serverTimestamp(),
        });
      }

      const role = userDoc.exists() ? userDoc.data().role : "provider";
      if (role !== "provider") {
        setStatus("error");
        setError("This account is not registered as a provider.");
        return;
      }

      router.push("/provider/apply");
    });

    return () => unsubscribe();
  }, [router]);

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
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        setVerificationPending(true);
        setStatus("error");
        setError("Please verify your email to continue.");
        return;
      }

      setStatus("success");
      router.push("/provider/apply");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.";
      setStatus("error");
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--prime-ink)]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
            Provider sign in
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Welcome back, provider.
          </h1>
          <p className="max-w-xl text-sm text-[color:rgba(20,21,22,0.7)]">
            Sign in to continue your provider onboarding.
          </p>
        </header>

        <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,42,34,0.12)]">
          {verificationPending ? (
            <div className="space-y-5">
              <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                Please verify your email address to continue. Check your inbox
                for the verification link.
              </p>
              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={async () => {
                  if (!auth.currentUser) return;
                  await auth.currentUser.reload();
                  if (auth.currentUser.emailVerified) {
                    setVerificationPending(false);
                    router.push("/provider/apply");
                  } else {
                    setError("Email not verified yet. Please try again.");
                  }
                }}
                className="rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)]"
              >
                I've verified my email
              </button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Email address
                <input
                  name="email"
                  type="email"
                  placeholder="you@domain.com"
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

              {status === "success" ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Signed in successfully.
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading" ? "Signing in..." : "Sign in"}
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/provider/sign-up"
            className="font-semibold uppercase tracking-[0.2em] text-[var(--prime-copper)]"
          >
            Create provider account
          </Link>
          <Link
            href="/"
            className="font-semibold uppercase tracking-[0.2em] text-[var(--prime-ink)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
