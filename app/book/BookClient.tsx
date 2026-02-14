"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const services = [
  "Home Cleaning",
  "Plumbing & Repairs",
  "Electrical Work",
  "Caregiving",
  "Handyman",
  "Outdoor Care",
];

type Step = 1 | 2 | 3 | 4 | 5;

type ProfileProvider = {
  id: string;
  displayName: string;
  services: string[];
  rating: number;
  reviewCount: number;
  bio: string;
  acceptingBookings: boolean;
  isOnline: boolean;
  isApproved: boolean;
};

type Status = "idle" | "loading" | "success" | "error";

type CustomerBooking = {
  id: string;
  providerUid?: string;
  providerName?: string;
  service?: string;
  date?: string;
  time?: string;
  status?: string;
  address?: string;
  customerRating?: number;
  createdAt?: Timestamp;
};

export default function BookClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("service");

  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState<string>(preselected || "");
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [providers, setProviders] = useState<ProfileProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [sessionRole, setSessionRole] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [submitStatus, setSubmitStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingLoadingId, setRatingLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setSessionUser(user);
      if (!user) {
        setSessionRole(null);
        setCheckingSession(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? userDoc.data().role : null;
        setSessionRole(role || null);
      } catch {
        setSessionRole(null);
      } finally {
        setCheckingSession(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!service) {
      setProviders([]);
      setSelectedProviderId("");
      return;
    }

    const loadProviders = async () => {
      setProvidersLoading(true);
      setProvidersError(null);

      try {
        const providerProfilesQuery = query(
          collection(db, "providerProfiles"),
          where("services", "array-contains", service)
        );
        const snapshot = await getDocs(providerProfilesQuery);

        const nextProviders = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const rating = Number(data.rating || 0);
            const reviewCount = Number(data.reviewCount || 0);
            return {
              id: docSnap.id,
              displayName: String(data.displayName || "Provider"),
              services: Array.isArray(data.services)
                ? data.services.filter((item: unknown) => typeof item === "string")
                : [],
              rating: Number.isFinite(rating) ? rating : 0,
              reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
              bio: String(data.bio || ""),
              acceptingBookings: Boolean(data.acceptingBookings),
              isOnline: Boolean(data.isOnline),
              isApproved: Boolean(data.isApproved),
            } as ProfileProvider;
          })
          .filter(
            (provider) =>
              provider.isApproved && provider.isOnline && provider.acceptingBookings
          )
          .sort((a, b) => {
            if (b.rating === a.rating) {
              return b.reviewCount - a.reviewCount;
            }
            return b.rating - a.rating;
          });

        setProviders(nextProviders);

        if (!nextProviders.some((provider) => provider.id === selectedProviderId)) {
          setSelectedProviderId(nextProviders[0]?.id || "");
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load providers for this service.";
        setProvidersError(message);
        setProviders([]);
        setSelectedProviderId("");
      } finally {
        setProvidersLoading(false);
      }
    };

    void loadProviders();
  }, [service, selectedProviderId]);

  useEffect(() => {
    if (!sessionUser || sessionRole !== "customer") {
      setCustomerBookings([]);
      return;
    }

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("customerUid", "==", sessionUser.uid)
    );

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const nextBookings = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as Omit<CustomerBooking, "id">;
          return { id: docSnap.id, ...data };
        })
        .sort((a, b) => {
          const aSeconds = a.createdAt?.seconds || 0;
          const bSeconds = b.createdAt?.seconds || 0;
          return bSeconds - aSeconds;
        });
      setCustomerBookings(nextBookings);
    });

    return () => unsubscribe();
  }, [sessionRole, sessionUser]);

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === selectedProviderId) || null,
    [providers, selectedProviderId]
  );

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(service);
    if (step === 2) return Boolean(selectedProviderId);
    if (step === 3) return Boolean(date && time);
    if (step === 4) return Boolean(address);
    return true;
  }, [step, service, selectedProviderId, date, time, address]);

  const nextStep = () => {
    if (!canContinue) return;
    setStep((prev) => Math.min(5, prev + 1) as Step);
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const submitBooking = async () => {
    if (!sessionUser || sessionRole !== "customer" || !selectedProvider) {
      return;
    }

    setSubmitStatus("loading");
    setSubmitError(null);

    try {
      await addDoc(collection(db, "bookings"), {
        customerUid: sessionUser.uid,
        customerName: sessionUser.displayName || "Customer",
        customerEmail: sessionUser.email || "",
        providerUid: selectedProvider.id,
        providerName: selectedProvider.displayName,
        service,
        date,
        time,
        address,
        notes,
        status: "requested",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubmitStatus("success");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create booking request.";
      setSubmitStatus("error");
      setSubmitError(message);
    }
  };

  const rateProvider = async (booking: CustomerBooking, rating: number) => {
    if (!sessionUser || !booking.providerUid) return;

    setRatingLoadingId(booking.id);
    setRatingError(null);

    try {
      await runTransaction(db, async (transaction) => {
        const bookingRef = doc(db, "bookings", booking.id);
        const providerRef = doc(db, "providerProfiles", booking.providerUid as string);

        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists()) {
          throw new Error("Booking not found.");
        }

        const bookingData = bookingSnap.data();
        if (bookingData.customerUid !== sessionUser.uid) {
          throw new Error("You are not allowed to rate this booking.");
        }
        if (bookingData.status !== "completed") {
          throw new Error("You can only rate completed bookings.");
        }
        if (bookingData.customerRating) {
          throw new Error("Booking already rated.");
        }

        const providerSnap = await transaction.get(providerRef);
        if (!providerSnap.exists()) {
          throw new Error("Provider profile not found.");
        }

        const providerData = providerSnap.data();
        const currentCount = Number(providerData.reviewCount || 0);
        const currentAverage = Number(providerData.rating || 0);
        const nextCount = currentCount + 1;
        const nextAverage =
          (currentAverage * currentCount + rating) / nextCount;

        transaction.update(providerRef, {
          rating: Number(nextAverage.toFixed(2)),
          reviewCount: nextCount,
          updatedAt: serverTimestamp(),
        });

        transaction.update(bookingRef, {
          customerRating: rating,
          ratedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to submit rating.";
      setRatingError(message);
    } finally {
      setRatingLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--prime-ink)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
            Book a service
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Schedule trusted help in minutes.
          </h1>
          <p className="max-w-2xl text-sm text-[color:rgba(20,21,22,0.7)]">
            Choose a service, select an available provider, and send your booking
            request.
          </p>
        </header>

        <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,42,34,0.12)]">
          <div className="mb-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--prime-ink)]">
            {["Service", "Provider", "Schedule", "Address", "Confirm"].map(
              (label, index) => {
                const current = step === index + 1;
                return (
                  <span
                    key={label}
                    className={`rounded-full border px-4 py-2 ${
                      current
                        ? "border-[var(--prime-forest)] bg-[var(--prime-forest)] text-white"
                        : "border-[var(--prime-sand)] bg-white text-[var(--prime-ink)]"
                    }`}
                  >
                    {label}
                  </span>
                );
              }
            )}
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                Choose the service you want to book.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setService(item)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      service === item
                        ? "border-[var(--prime-forest)] bg-[var(--prime-forest)] text-white"
                        : "border-[var(--prime-sand)] bg-white text-[var(--prime-ink)] hover:border-[var(--prime-forest)]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                Select from providers currently online and accepting bookings.
              </p>
              {providersLoading ? (
                <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                  Loading available providers...
                </p>
              ) : null}
              {providersError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {providersError}
                </p>
              ) : null}
              {!providersLoading && providers.length === 0 ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No available providers are currently open for {service}.
                </p>
              ) : null}
              <div className="grid gap-3">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProviderId(provider.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedProviderId === provider.id
                        ? "border-[var(--prime-forest)] bg-[var(--prime-forest)] text-white"
                        : "border-[var(--prime-sand)] bg-white hover:border-[var(--prime-forest)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{provider.displayName}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                        Rating {provider.rating.toFixed(1)} ({provider.reviewCount})
                      </p>
                    </div>
                    <p
                      className={`mt-2 text-sm ${
                        selectedProviderId === provider.id
                          ? "text-white/90"
                          : "text-[color:rgba(20,21,22,0.7)]"
                      }`}
                    >
                      {provider.bio || "No profile bio yet."}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                Select a date and time that works best for you.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                  Date
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)]"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                  Time
                  <input
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)]"
                  />
                </label>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                Add the address and any helpful notes for the provider.
              </p>
              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Service address
                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="24 Parkview Lane"
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)]"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Notes (optional)
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Gate code, parking details, preferred supplies, etc."
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)]"
                />
              </label>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                Review your booking request and submit.
              </p>
              <div className="grid gap-3 rounded-2xl border border-[var(--prime-sand)] bg-[var(--prime-cream)] p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[color:rgba(20,21,22,0.7)]">Service</span>
                  <span className="font-semibold">{service || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[color:rgba(20,21,22,0.7)]">Provider</span>
                  <span className="font-semibold">{selectedProvider?.displayName || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[color:rgba(20,21,22,0.7)]">Schedule</span>
                  <span className="font-semibold">
                    {date && time ? `${date} • ${time}` : "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[color:rgba(20,21,22,0.7)]">Address</span>
                  <span className="font-semibold">{address || "Not set"}</span>
                </div>
              </div>

              {checkingSession ? (
                <p className="text-sm text-[color:rgba(20,21,22,0.7)]">Checking sign-in status...</p>
              ) : null}

              {!checkingSession && !sessionUser ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Sign in as a customer to submit this booking request.
                </p>
              ) : null}

              {!checkingSession && sessionUser && sessionRole !== "customer" ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  This account is not registered as a customer.
                </p>
              ) : null}

              {submitError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </p>
              ) : null}

              {submitStatus === "success" ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Booking request sent. Your provider will review and respond.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="rounded-full border border-[var(--prime-forest)] px-6 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canContinue}
                className="rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Continue
              </button>
            ) : !sessionUser ? (
              <button
                type="button"
                onClick={() => router.push("/sign-in")}
                className="rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)]"
              >
                Sign in to submit
              </button>
            ) : (
              <button
                type="button"
                onClick={submitBooking}
                disabled={
                  submitStatus === "loading" ||
                  submitStatus === "success" ||
                  sessionRole !== "customer"
                }
                className="rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitStatus === "loading" ? "Submitting..." : "Submit request"}
              </button>
            )}
          </div>
        </div>

        {sessionUser && sessionRole === "customer" ? (
          <section className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,42,34,0.12)]">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--prime-copper)]">
                My bookings
              </p>
              <h2 className="font-serif text-2xl">Your recent requests</h2>
              {ratingError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {ratingError}
                </p>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              {customerBookings.length === 0 ? (
                <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                  No bookings yet.
                </p>
              ) : null}
              {customerBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-[var(--prime-sand)] bg-[var(--prime-cream)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {booking.service || "Service"} with {booking.providerName || "Provider"}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--prime-copper)]">
                      {booking.status || "requested"}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[color:rgba(20,21,22,0.7)]">
                    {booking.date || "-"} • {booking.time || "-"} • {booking.address || "-"}
                  </p>

                  {booking.status === "completed" && !booking.customerRating ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--prime-ink)]">
                        Rate provider
                      </span>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={`${booking.id}-${value}`}
                          type="button"
                          onClick={() => rateProvider(booking, value)}
                          disabled={ratingLoadingId === booking.id}
                          className="rounded-full border border-[var(--prime-forest)] px-3 py-1 text-xs font-semibold text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {booking.customerRating ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      You rated this provider: {booking.customerRating}/5
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
