"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const highlights = [
  {
    title: "Flexible schedule",
    description: "Choose the jobs and hours that fit your routine.",
  },
  {
    title: "Quality clients",
    description: "Work with households looking for trusted professionals.",
  },
  {
    title: "Fast payouts",
    description: "Track earnings and receive weekly deposits.",
  },
];

const steps = [
  {
    title: "Apply",
    description: "Tell us about your services, experience, and coverage area.",
  },
  {
    title: "Verify",
    description: "Complete background checks and required documentation.",
  },
  {
    title: "Go live",
    description: "Set your availability and start receiving bookings.",
  },
];

const requirements = [
  "Government-issued ID",
  "Proof of experience or certifications",
  "Background check consent",
  "Reliable transportation (when needed)",
];

export default function ProviderApplyPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/provider/sign-up");
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.exists() ? userDoc.data().role : null;
      if (role !== "provider") {
        router.replace("/provider/sign-up");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--prime-ink)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
            Provider onboarding
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Grow your business with Prime Care.
          </h1>
          <p className="max-w-2xl text-sm text-[color:rgba(20,21,22,0.7)]">
            Join a trusted network of home-service professionals. We bring the
            demand, you deliver great work. Apply in minutes and get verified to
            start earning.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => router.push("/provider/apply/start")}
              className="rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)]"
            >
              Start application
            </button>
            <button
              onClick={() => router.push("/")}
              className="rounded-full border border-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
            >
              Back to home
            </button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_16px_40px_rgba(15,42,34,0.08)]"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-[color:rgba(20,21,22,0.7)]">
                {item.description}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,42,34,0.12)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--prime-copper)]">
              How it works
            </p>
            <div className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-[var(--prime-sand)] bg-[var(--prime-cream)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--prime-forest)] text-xs font-semibold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm font-semibold">{step.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-[color:rgba(20,21,22,0.7)]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,42,34,0.12)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--prime-copper)]">
              Requirements
            </p>
            <p className="mt-4 text-sm text-[color:rgba(20,21,22,0.7)]">
              We verify every provider to keep households safe and confident.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              {requirements.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[var(--prime-sand)] bg-[var(--prime-cream)] px-4 py-3 font-medium"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
