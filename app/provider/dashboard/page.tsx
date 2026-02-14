"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AccessState = "checking" | "active" | "blocked" | "error";
type Tab = "overview" | "requests" | "profile";

type ProviderProfile = {
  displayName: string;
  bio: string;
  services: string[];
  acceptingBookings: boolean;
  isOnline: boolean;
  rating: number;
  reviewCount: number;
  isApproved: boolean;
};

type BookingRequest = {
  id: string;
  customerName?: string;
  customerEmail?: string;
  service?: string;
  date?: string;
  time?: string;
  address?: string;
  notes?: string;
  status?: string;
  createdAt?: Timestamp;
};

type ProviderApplication = {
  service?: string;
  name?: string;
  status?: string;
  createdAt?: Timestamp;
};

const serviceOptions = [
  "Home Cleaning",
  "Plumbing & Repairs",
  "Electrical Work",
  "Caregiving",
  "Handyman",
  "Outdoor Care",
];

function formatTimestamp(value?: Timestamp): string {
  if (!value) return "-";
  try {
    return value.toDate().toLocaleString();
  } catch {
    return "-";
  }
}

export default function ProviderDashboardPage() {
  const router = useRouter();
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const [providerUid, setProviderUid] = useState<string | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileServices, setProfileServices] = useState<string[]>([]);

  useEffect(() => {
    let unsubscribeApps: (() => void) | null = null;
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeBookings: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeApps) unsubscribeApps();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeBookings) unsubscribeBookings();
      unsubscribeApps = null;
      unsubscribeProfile = null;
      unsubscribeBookings = null;

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

        setProviderUid(user.uid);

        const providerApplicationsQuery = query(
          collection(db, "providerApplications"),
          where("providerUid", "==", user.uid)
        );

        unsubscribeApps = onSnapshot(
          providerApplicationsQuery,
          async (snapshot) => {
            if (unsubscribeProfile) {
              unsubscribeProfile();
              unsubscribeProfile = null;
            }
            if (unsubscribeBookings) {
              unsubscribeBookings();
              unsubscribeBookings = null;
            }

            const applicationDocs = snapshot.docs
              .map((docSnap) => docSnap.data() as ProviderApplication)
              .sort((a, b) => {
                const aSeconds = a.createdAt?.seconds || 0;
                const bSeconds = b.createdAt?.seconds || 0;
                return bSeconds - aSeconds;
              });

            const latest = applicationDocs[0] || null;
            const hasApproved = applicationDocs.some(
              (application) => application.status === "approved"
            );

            if (!hasApproved) {
              setAccessState("blocked");
              return;
            }

            setAccessState("active");

            await setDoc(
              doc(db, "providerProfiles", user.uid),
              {
                displayName: latest?.name || user.displayName || "Provider",
                bio: "",
                services: latest?.service ? [latest.service] : [],
                acceptingBookings: false,
                isOnline: false,
                rating: 5,
                reviewCount: 0,
                isApproved: true,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );

            unsubscribeProfile = onSnapshot(doc(db, "providerProfiles", user.uid), (profileSnap) => {
              if (!profileSnap.exists()) return;
              const data = profileSnap.data();
              const nextProfile: ProviderProfile = {
                displayName: String(data.displayName || "Provider"),
                bio: String(data.bio || ""),
                services: Array.isArray(data.services)
                  ? data.services.filter((item: unknown) => typeof item === "string")
                  : [],
                acceptingBookings: Boolean(data.acceptingBookings),
                isOnline: Boolean(data.isOnline),
                rating: Number(data.rating || 0),
                reviewCount: Number(data.reviewCount || 0),
                isApproved: Boolean(data.isApproved),
              };

              setProviderProfile(nextProfile);
              setProfileName(nextProfile.displayName);
              setProfileBio(nextProfile.bio);
              setProfileServices(nextProfile.services);
            });

            const bookingsQuery = query(
              collection(db, "bookings"),
              where("providerUid", "==", user.uid)
            );

            unsubscribeBookings = onSnapshot(bookingsQuery, (bookingSnap) => {
              const nextBookings = bookingSnap.docs
                .map((docSnap) => {
                  const data = docSnap.data() as Omit<BookingRequest, "id">;
                  return { id: docSnap.id, ...data };
                })
                .sort((a, b) => {
                  const aSeconds = a.createdAt?.seconds || 0;
                  const bSeconds = b.createdAt?.seconds || 0;
                  return bSeconds - aSeconds;
                });

              setBookingRequests(nextBookings);
            });
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
      if (unsubscribeApps) unsubscribeApps();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeBookings) unsubscribeBookings();
    };
  }, [router]);

  const pendingRequests = useMemo(
    () => bookingRequests.filter((request) => request.status === "requested"),
    [bookingRequests]
  );

  const acceptedRequests = useMemo(
    () => bookingRequests.filter((request) => request.status === "accepted"),
    [bookingRequests]
  );

  const updateBookingStatus = async (bookingId: string, nextStatus: string) => {
    if (!providerUid) return;
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
        providerUpdatedBy: providerUid,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update booking.";
      setError(message);
    }
  };

  const updateAvailability = async (field: "acceptingBookings" | "isOnline", value: boolean) => {
    if (!providerUid) return;
    try {
      await updateDoc(doc(db, "providerProfiles", providerUid), {
        [field]: value,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update availability.";
      setError(message);
    }
  };

  const saveProfile = async () => {
    if (!providerUid) return;

    if (!profileName.trim()) {
      setError("Profile name is required.");
      return;
    }

    if (profileServices.length === 0) {
      setError("Select at least one service.");
      return;
    }

    setSavingProfile(true);
    setError(null);

    try {
      await updateDoc(doc(db, "providerProfiles", providerUid), {
        displayName: profileName.trim(),
        bio: profileBio.trim(),
        services: profileServices,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save profile.";
      setError(message);
    } finally {
      setSavingProfile(false);
    }
  };

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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
              Provider dashboard
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl">Manage bookings and profile</h1>
            <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
              Control your availability, review booking requests, and update your profile.
            </p>
          </div>
          <button
            onClick={async () => {
              await auth.signOut();
              router.push("/provider/sign-in");
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

        <nav className="flex flex-wrap gap-3">
          {[
            { key: "overview", label: "Overview" },
            { key: "requests", label: "Booking requests" },
            { key: "profile", label: "Profile" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as Tab)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                tab === item.key
                  ? "border-[var(--prime-forest)] bg-[var(--prime-forest)] text-white"
                  : "border-[var(--prime-sand)] bg-white text-[var(--prime-ink)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "overview" ? (
          <section className="grid gap-5 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_35px_rgba(15,42,34,0.08)]">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--prime-copper)]">Availability</p>
              <p className="mt-2 text-sm font-semibold">
                {providerProfile?.acceptingBookings ? "Open for bookings" : "Closed for bookings"}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => updateAvailability("acceptingBookings", true)}
                  className="rounded-full bg-[var(--prime-forest)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white"
                >
                  Open
                </button>
                <button
                  onClick={() => updateAvailability("acceptingBookings", false)}
                  className="rounded-full border border-[var(--prime-forest)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--prime-forest)]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_35px_rgba(15,42,34,0.08)]">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--prime-copper)]">Presence</p>
              <p className="mt-2 text-sm font-semibold">
                {providerProfile?.isOnline ? "Online" : "Offline"}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => updateAvailability("isOnline", true)}
                  className="rounded-full bg-[var(--prime-forest)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white"
                >
                  Go online
                </button>
                <button
                  onClick={() => updateAvailability("isOnline", false)}
                  className="rounded-full border border-[var(--prime-forest)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--prime-forest)]"
                >
                  Go offline
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_35px_rgba(15,42,34,0.08)]">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--prime-copper)]">Bookings</p>
              <p className="mt-2 text-sm font-semibold">{pendingRequests.length} pending requests</p>
              <p className="mt-1 text-sm text-[color:rgba(20,21,22,0.7)]">
                {acceptedRequests.length} accepted jobs
              </p>
            </div>
          </section>
        ) : null}

        {tab === "requests" ? (
          <section className="space-y-4">
            {bookingRequests.length === 0 ? (
              <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 text-sm text-[color:rgba(20,21,22,0.7)] shadow-[0_12px_35px_rgba(15,42,34,0.08)]">
                No booking requests yet.
              </div>
            ) : null}

            {bookingRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_35px_rgba(15,42,34,0.08)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{request.service || "Service"}</p>
                    <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                      {request.customerName || "Customer"} • {request.customerEmail || "No email"}
                    </p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--prime-copper)]">
                    {request.status || "requested"}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-semibold">Date:</span> {request.date || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Time:</span> {request.time || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Address:</span> {request.address || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Requested:</span> {formatTimestamp(request.createdAt)}
                  </p>
                </div>

                {request.notes ? (
                  <p className="mt-3 rounded-xl bg-[var(--prime-cream)] px-3 py-2 text-sm text-[color:rgba(20,21,22,0.75)]">
                    <span className="font-semibold">Notes:</span> {request.notes}
                  </p>
                ) : null}

                {request.status === "requested" ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => updateBookingStatus(request.id, "accepted")}
                      className="rounded-full bg-[var(--prime-forest)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateBookingStatus(request.id, "declined")}
                      className="rounded-full border border-red-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-600"
                    >
                      Decline
                    </button>
                  </div>
                ) : null}
                {request.status === "accepted" ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => updateBookingStatus(request.id, "completed")}
                      className="rounded-full bg-[var(--prime-forest)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
                    >
                      Mark completed
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        ) : null}

        {tab === "profile" ? (
          <section className="rounded-[24px] border border-white/70 bg-white/70 p-6 shadow-[0_12px_35px_rgba(15,42,34,0.08)]">
            <div className="space-y-5">
              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Display name
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)]"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Bio
                <textarea
                  rows={4}
                  value={profileBio}
                  onChange={(event) => setProfileBio(event.target.value)}
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)]"
                />
              </label>

              <div className="space-y-2">
                <p className="text-sm font-medium">Services</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {serviceOptions.map((item) => {
                    const active = profileServices.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setProfileServices((prev) =>
                            prev.includes(item)
                              ? prev.filter((value) => value !== item)
                              : [...prev, item]
                          );
                        }}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                          active
                            ? "border-[var(--prime-forest)] bg-[var(--prime-forest)] text-white"
                            : "border-[var(--prime-sand)] bg-white"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--prime-sand)] bg-[var(--prime-cream)] px-4 py-3 text-sm">
                <p>
                  <span className="font-semibold">Rating:</span> {providerProfile?.rating?.toFixed(1) || "0.0"}
                </p>
                <p>
                  <span className="font-semibold">Reviews:</span> {providerProfile?.reviewCount || 0}
                </p>
              </div>

              <button
                type="button"
                onClick={saveProfile}
                disabled={savingProfile}
                className="rounded-full bg-[var(--prime-forest)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
