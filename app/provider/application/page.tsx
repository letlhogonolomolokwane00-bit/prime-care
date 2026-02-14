"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  Timestamp,
  where,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type ViewState = "checking" | "ready" | "error";

type UploadedDocument = {
  name?: string;
  url?: string;
  path?: string;
  contentType?: string;
  size?: number;
};

type ProviderDocuments = {
  idDocument?: UploadedDocument;
  selfie?: UploadedDocument;
  proofOfAddress?: UploadedDocument;
  consentForm?: UploadedDocument;
  certifications?: UploadedDocument[];
};

type ProviderApplication = {
  id: string;
  providerUid?: string;
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  experience?: string;
  area?: string;
  availability?: string;
  status?: string;
  createdAt?: Timestamp;
  reviewedAt?: Timestamp;
  documents?: ProviderDocuments;
};

const statusMeta: Record<string, { title: string; details: string; tone: string }> = {
  manual_review_pending: {
    title: "Pending manual review",
    details: "Your documents were received. Admin is reviewing your application.",
    tone: "text-amber-700 bg-amber-50 border-amber-200",
  },
  needs_more_info: {
    title: "More information needed",
    details: "Admin requested additional details. Please contact support to update your submission.",
    tone: "text-orange-700 bg-orange-50 border-orange-200",
  },
  approved: {
    title: "Approved",
    details: "You are approved and now active on Prime Care.",
    tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  rejected: {
    title: "Not approved",
    details: "Your application was not approved at this time.",
    tone: "text-red-700 bg-red-50 border-red-200",
  },
};

function formatTimestamp(value?: Timestamp): string {
  if (!value) return "-";
  try {
    return value.toDate().toLocaleString();
  } catch {
    return "-";
  }
}

export default function ProviderApplicationStatusPage() {
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>("checking");
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ProviderApplication | null>(null);

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

        setViewState("ready");

        const providerApplicationsQuery = query(
          collection(db, "providerApplications"),
          where("providerUid", "==", user.uid)
        );

        unsubscribeApps = onSnapshot(
          providerApplicationsQuery,
          (snapshot) => {
            const docs: ProviderApplication[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data() as Omit<ProviderApplication, "id">;
              return { id: docSnap.id, ...data };
            });

            if (docs.length === 0) {
              setApplication(null);
              return;
            }

            docs.sort((a, b) => {
              const aSeconds = a.createdAt?.seconds || 0;
              const bSeconds = b.createdAt?.seconds || 0;
              return bSeconds - aSeconds;
            });

            const latest = docs[0];
            setApplication(latest);
          },
          (snapshotError) => {
            setError(snapshotError.message || "Unable to load application status.");
          }
        );

      } catch (err) {
        setViewState("error");
        setError(err instanceof Error ? err.message : "Unable to load your profile.");
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeApps) {
        unsubscribeApps();
      }
    };
  }, [router]);

  const currentStatus = useMemo(() => {
    if (!application?.status) return null;
    return statusMeta[application.status] || {
      title: application.status,
      details: "Your application is being processed.",
      tone: "text-[var(--prime-ink)] bg-[var(--prime-cream)] border-[var(--prime-sand)]",
    };
  }, [application]);

  if (viewState === "checking") {
    return (
      <div className="min-h-screen bg-[var(--background)] px-6 py-16 text-[var(--prime-ink)]">
        <p className="mx-auto max-w-4xl text-sm text-[color:rgba(20,21,22,0.7)]">
          Checking your provider session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--prime-ink)]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
            Provider application
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Track your onboarding status.
          </h1>
          <p className="max-w-2xl text-sm text-[color:rgba(20,21,22,0.7)]">
            This page updates automatically when admin reviews your application.
          </p>
        </header>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {!application ? (
          <div className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_16px_40px_rgba(15,42,34,0.08)]">
            <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
              No application found yet. Start your provider application to continue onboarding.
            </p>
            <button
              onClick={() => router.push("/provider/apply/start")}
              className="mt-5 rounded-full bg-[var(--prime-forest)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)]"
            >
              Start application
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {currentStatus ? (
              <div className={`rounded-2xl border px-5 py-4 ${currentStatus.tone}`}>
                <p className="text-sm font-semibold uppercase tracking-[0.12em]">{currentStatus.title}</p>
                <p className="mt-1 text-sm">{currentStatus.details}</p>
              </div>
            ) : null}

            <div className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_16px_40px_rgba(15,42,34,0.08)]">
              <h2 className="text-lg font-semibold">Application details</h2>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="font-semibold">Service:</span> {application.service || "-"}
                </p>
                <p>
                  <span className="font-semibold">Experience:</span> {application.experience || "-"} years
                </p>
                <p>
                  <span className="font-semibold">Area:</span> {application.area || "-"}
                </p>
                <p>
                  <span className="font-semibold">Availability:</span> {application.availability || "-"}
                </p>
                <p>
                  <span className="font-semibold">Submitted:</span> {formatTimestamp(application.createdAt)}
                </p>
                <p>
                  <span className="font-semibold">Last reviewed:</span> {formatTimestamp(application.reviewedAt)}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--prime-sand)] bg-[var(--prime-cream)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--prime-copper)]">
                  Uploaded documents
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {application.documents?.idDocument?.url ? (
                    <a
                      href={application.documents.idDocument.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--prime-forest)] px-4 py-2 font-semibold text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                    >
                      ID document
                    </a>
                  ) : null}
                  {application.documents?.selfie?.url ? (
                    <a
                      href={application.documents.selfie.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--prime-forest)] px-4 py-2 font-semibold text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                    >
                      Selfie
                    </a>
                  ) : null}
                  {application.documents?.proofOfAddress?.url ? (
                    <a
                      href={application.documents.proofOfAddress.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--prime-forest)] px-4 py-2 font-semibold text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                    >
                      Proof of address
                    </a>
                  ) : null}
                  {application.documents?.consentForm?.url ? (
                    <a
                      href={application.documents.consentForm.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--prime-forest)] px-4 py-2 font-semibold text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                    >
                      Consent form
                    </a>
                  ) : null}
                  {(application.documents?.certifications || []).map((cert, index) =>
                    cert.url ? (
                      <a
                        key={`${application.id}-cert-${index}`}
                        href={cert.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[var(--prime-forest)] px-4 py-2 font-semibold text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                      >
                        Certification {index + 1}
                      </a>
                    ) : null
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/provider/apply")}
                  className="rounded-full border border-[var(--prime-forest)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                >
                  Provider home
                </button>
                {application.status === "approved" ? (
                  <button
                    onClick={() => router.push("/provider/dashboard")}
                    className="rounded-full bg-[var(--prime-forest)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--prime-ink)]"
                  >
                    Go to dashboard
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
