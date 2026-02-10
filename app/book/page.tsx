"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const services = [
  "Home Cleaning",
  "Plumbing & Repairs",
  "Electrical Work",
  "Caregiving",
  "Handyman",
  "Outdoor Care",
];

type Step = 1 | 2 | 3 | 4;

export default function BookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("service");

  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState<string>(preselected || "");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(service);
    if (step === 2) return Boolean(date && time);
    if (step === 3) return Boolean(address);
    return true;
  }, [step, service, date, time, address]);

  const nextStep = () => {
    if (!canContinue) return;
    setStep((prev) => Math.min(4, prev + 1) as Step);
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1) as Step);
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
            Tell us what you need, pick a time, and confirm your details. We will
            match you with a vetted professional.
          </p>
        </header>

        <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,42,34,0.12)]">
          <div className="mb-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--prime-ink)]">
            {["Service", "Schedule", "Address", "Confirm"].map((label, index) => {
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
            })}
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

          {step === 3 ? (
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

          {step === 4 ? (
            <div className="space-y-4">
              <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
                Review your booking details. You can confirm and sign in on the
                next step.
              </p>
              <div className="grid gap-3 rounded-2xl border border-[var(--prime-sand)] bg-[var(--prime-cream)] p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[color:rgba(20,21,22,0.7)]">Service</span>
                  <span className="font-semibold">{service || "Not set"}</span>
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
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--prime-copper)]">
                Next: Sign in to confirm
              </p>
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
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canContinue}
                className="rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/sign-in")}
                className="rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)]"
              >
                Sign in to confirm
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
