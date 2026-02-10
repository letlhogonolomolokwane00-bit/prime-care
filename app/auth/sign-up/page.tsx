"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Status = "idle" | "loading" | "success" | "error";

export default function CustomerSignUpPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!name || !email || !password) {
      setStatus("error");
      setError("Please complete all fields.");
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(credential.user, { displayName: name });
      await sendEmailVerification(credential.user);

      setPendingUserId(credential.user.uid);
      setVerificationSent(true);
      setStatus("success");
      return;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create account. Please try again.";
      setStatus("error");
      setError(message);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser || !pendingUserId) {
      setError("Please sign in again to continue.");
      return;
    }
    setVerifying(true);
    setError(null);

    try {
      await auth.currentUser.reload();
      if (!auth.currentUser.emailVerified) {
        setError("Email not verified yet. Please check your inbox.");
        return;
      }

      await setDoc(doc(db, "users", pendingUserId), {
        uid: pendingUserId,
        name: auth.currentUser.displayName || "Customer",
        email: auth.currentUser.email || "",
        role: "customer",
        createdAt: serverTimestamp(),
      });

      setStatus("success");
      window.location.href = "/book";
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to complete verification. Please try again.";
      setStatus("error");
      setError(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!auth.currentUser) {
      setError("Please sign in again to resend the verification email.");
      return;
    }
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to resend verification email.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--prime-ink)]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
            Get started
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Create your Prime Care account.
          </h1>
          <p className="max-w-xl text-sm text-[color:rgba(20,21,22,0.7)]">
            Sign up as a customer to book trusted home services in minutes.
          </p>
        </header>

        <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,42,34,0.12)]">
          {verificationSent ? (
            <div className="space-y-5">
              <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                We sent a verification email to your inbox. Please confirm your
                email address to finish creating your account.
              </p>
              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={handleCheckVerification}
                  disabled={verifying}
                  className="rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {verifying ? "Checking..." : "I've verified my email"}
                </button>
                <button
                  onClick={handleResend}
                  className="rounded-full border border-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                >
                  Resend email
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Full name
                <input
                  name="name"
                  type="text"
                  placeholder="Amara Daniels"
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)]"
                />
              </label>
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
                  placeholder="Minimum 6 characters"
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
                  Account created. You can now sign in.
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading"
                  ? "Creating account..."
                  : "Create account"}
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/sign-in"
            className="font-semibold uppercase tracking-[0.2em] text-[var(--prime-copper)]"
          >
            Sign in instead
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
