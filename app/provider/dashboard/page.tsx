"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AccessState = "checking" | "active" | "blocked" | "error";

export default function ProviderDashboardPage() {
  const router = useRouter();
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeApps: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeApps) {
        unsubscribeApps();
        unsubscribeApps = null;
      }

      if (!user) {
        router.replace("/provider/sign-in");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? userDoc.data().role : null;

        if (role !== "provider") {
          router.replace("/provider/sign-in");
          return;
        }

        const providerApplicationsQuery = query(
          collection(db, "providerApplications"),
          where("providerUid", "==", user.uid)
        );

        unsubscribeApps = onSnapshot(
          providerApplicationsQuery,
          (snapshot) => {
            const hasApproved = snapshot.docs.some((docSnap) => {
              const data = docSnap.data();
              return data.status === "approved";
            });

            if (hasApproved) {
              setAccessState("active");
            } else {
              setAccessState("blocked");
            }
          },
          (snapshotError) => {
            setAccessState("error");
            setError(snapshotError.message || "Unable to verify provider access.");
          }
        );

      } catch (err) {
        setAccessState("error");
        setError(err instanceof Error ? err.message : "Unable to load dashboard.");
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeApps) {
        unsubscribeApps();
      }
    };
  }, [router]);

  if (accessState === "checking") {
    return (
      <div className="min-h-screen bg-[var(--background)] px-6 py-16 text-[var(--prime-ink)]">
        <p className="mx-auto max-w-4xl text-sm text-[color:rgba(20,21,22,0.7)]">
          Checking provider access...
        </p>
      </div>
    );
  }

  if (accessState === "blocked") {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--prime-ink)]">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-16">
          <h1 className="font-serif text-3xl sm:text-4xl">Provider dashboard</h1>
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your application is not approved yet. You will get full provider access once admin approves your status.
          </p>
          <button
            onClick={() => router.push("/provider/application")}
            className="w-fit rounded-full bg-[var(--prime-forest)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)]"
          >
            View application status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--prime-ink)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
            Provider dashboard
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Your provider account is active.
          </h1>
          <p className="max-w-3xl text-sm text-[color:rgba(20,21,22,0.7)]">
            You now have full access as an approved provider on Prime Care. This is your active dashboard area.
          </p>
        </header>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_35px_rgba(15,42,34,0.08)]">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--prime-copper)]">Status</p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">Active</p>
            <p className="mt-2 text-sm text-[color:rgba(20,21,22,0.7)]">Eligible to receive bookings.</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_35px_rgba(15,42,34,0.08)]">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--prime-copper)]">Application</p>
            <p className="mt-2 text-lg font-semibold">Approved</p>
            <button
              onClick={() => router.push("/provider/application")}
              className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--prime-forest)]"
            >
              View submission details
            </button>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_35px_rgba(15,42,34,0.08)]">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--prime-copper)]">Next step</p>
            <p className="mt-2 text-lg font-semibold">Start accepting jobs</p>
            <p className="mt-2 text-sm text-[color:rgba(20,21,22,0.7)]">Provider operations can be expanded here.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
