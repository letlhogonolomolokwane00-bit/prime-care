"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type DashboardStatus = "checking" | "ready" | "error";

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
  hasInsurance?: string;
  status?: string;
  reviewRequired?: boolean;
  createdAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  documents?: ProviderDocuments;
};

const reviewStatuses = [
  { value: "manual_review_pending", label: "Mark pending" },
  { value: "approved", label: "Approve" },
  { value: "needs_more_info", label: "Needs info" },
  { value: "rejected", label: "Reject" },
];

function formatTimestamp(value?: Timestamp): string {
  if (!value) return "-";
  try {
    return value.toDate().toLocaleString();
  } catch {
    return "-";
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [dashboardStatus, setDashboardStatus] = useState<DashboardStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<ProviderApplication[]>([]);
  const [adminUid, setAdminUid] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/sign-in");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? userDoc.data().role : null;

        if (role !== "admin") {
          router.replace("/admin/sign-in");
          return;
        }

        setAdminUid(user.uid);
        setDashboardStatus("ready");
      } catch (err) {
        setDashboardStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load admin profile.");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (dashboardStatus !== "ready") return;

    const applicationsQuery = query(
      collection(db, "providerApplications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      applicationsQuery,
      (snapshot) => {
        const nextData: ProviderApplication[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<ProviderApplication, "id">;
          return {
            id: docSnap.id,
            ...data,
          };
        });
        setApplications(nextData);
      },
      (err) => {
        setError(err.message || "Failed to load applications.");
      }
    );

    return () => unsubscribe();
  }, [dashboardStatus]);

  const pendingCount = useMemo(
    () => applications.filter((item) => item.status === "manual_review_pending").length,
    [applications]
  );

  const handleStatusChange = async (applicationId: string, nextStatus: string) => {
    if (!adminUid) return;

    setUpdatingId(applicationId);
    setError(null);

    try {
      await updateDoc(doc(db, "providerApplications", applicationId), {
        status: nextStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: adminUid,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (dashboardStatus === "checking") {
    return (
      <div className="min-h-screen bg-[var(--background)] px-6 py-16 text-[var(--prime-ink)]">
        <p className="mx-auto max-w-6xl text-sm text-[color:rgba(20,21,22,0.7)]">
          Checking admin access...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--prime-ink)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
              Admin dashboard
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl">
              Provider application review
            </h1>
            <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
              {pendingCount} pending review • {applications.length} total submissions
            </p>
          </div>
          <button
            onClick={async () => {
              await auth.signOut();
              router.push("/admin/sign-in");
            }}
            className="rounded-full border border-[var(--prime-forest)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
          >
            Sign out
          </button>
        </header>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <section className="space-y-5">
          {applications.length === 0 ? (
            <div className="rounded-[28px] border border-white/70 bg-white/70 p-6 text-sm text-[color:rgba(20,21,22,0.7)] shadow-[0_16px_40px_rgba(15,42,34,0.08)]">
              No provider applications yet.
            </div>
          ) : null}

          {applications.map((application) => {
            const docs = application.documents;
            const certifications = docs?.certifications || [];

            return (
              <article
                key={application.id}
                className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_16px_40px_rgba(15,42,34,0.08)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{application.name || "Unknown applicant"}</h2>
                    <p className="mt-1 text-sm text-[color:rgba(20,21,22,0.7)]">
                      {application.email || "No email"} • {application.phone || "No phone"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--prime-copper)]">
                      {application.service || "Service not set"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.14em] text-[color:rgba(20,21,22,0.55)]">
                      Current status
                    </p>
                    <p className="text-sm font-semibold uppercase tracking-[0.1em]">
                      {application.status || "unknown"}
                    </p>
                    <p className="mt-2 text-xs text-[color:rgba(20,21,22,0.55)]">
                      Submitted: {formatTimestamp(application.createdAt)}
                    </p>
                    <p className="text-xs text-[color:rgba(20,21,22,0.55)]">
                      Reviewed: {formatTimestamp(application.reviewedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                  <p>
                    <span className="font-semibold">Area:</span> {application.area || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Availability:</span> {application.availability || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Experience:</span> {application.experience || "-"} years
                  </p>
                  <p>
                    <span className="font-semibold">Insurance:</span> {application.hasInsurance || "-"}
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-[var(--prime-sand)] bg-[var(--prime-cream)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--prime-copper)]">
                    Documents
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {docs?.idDocument?.url ? (
                      <a
                        href={docs.idDocument.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[var(--prime-forest)] px-4 py-2 font-semibold text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                      >
                        Open ID
                      </a>
                    ) : null}
                    {docs?.selfie?.url ? (
                      <a
                        href={docs.selfie.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[var(--prime-forest)] px-4 py-2 font-semibold text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                      >
                        Open selfie
                      </a>
                    ) : null}
                    {docs?.proofOfAddress?.url ? (
                      <a
                        href={docs.proofOfAddress.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[var(--prime-forest)] px-4 py-2 font-semibold text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                      >
                        Open proof of address
                      </a>
                    ) : null}
                    {docs?.consentForm?.url ? (
                      <a
                        href={docs.consentForm.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[var(--prime-forest)] px-4 py-2 font-semibold text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
                      >
                        Open consent form
                      </a>
                    ) : null}
                    {certifications.map((cert, index) =>
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
                    {!docs?.idDocument?.url &&
                    !docs?.selfie?.url &&
                    !docs?.proofOfAddress?.url &&
                    !docs?.consentForm?.url &&
                    certifications.length === 0 ? (
                      <p className="text-sm text-[color:rgba(20,21,22,0.7)]">No document URLs available.</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {reviewStatuses.map((statusOption) => (
                    <button
                      key={statusOption.value}
                      onClick={() => handleStatusChange(application.id, statusOption.value)}
                      disabled={updatingId === application.id}
                      className="rounded-full bg-[var(--prime-forest)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--prime-ink)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {updatingId === application.id ? "Updating..." : statusOption.label}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
