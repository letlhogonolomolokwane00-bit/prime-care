"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Status = "idle" | "loading" | "success" | "error";
type FieldErrors = Partial<Record<string, string>>;

const serviceOptions = [
  "Home Cleaning",
  "Plumbing & Repairs",
  "Electrical Work",
  "Caregiving",
  "Handyman",
  "Outdoor Care",
];

const availabilityOptions = [
  "Weekdays",
  "Weekends",
  "Evenings",
  "Flexible",
  "Full-time",
];

export default function ProviderApplyStartPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const rawPhone = String(formData.get("phone") || "").trim();
    const normalizedPhone = rawPhone.replace(/[^\d+]/g, "");
    const sanitizedPhone = normalizedPhone.startsWith("+")
      ? `+${normalizedPhone.replace(/[^\d]/g, "")}`
      : normalizedPhone.replace(/[^\d]/g, "");
    const service = String(formData.get("service") || "").trim();
    const experience = String(formData.get("experience") || "").trim();
    const area = String(formData.get("area") || "").trim();
    const availability = String(formData.get("availability") || "").trim();
    const hasInsurance = String(formData.get("insurance") || "").trim();
    const business = String(formData.get("business") || "").trim();
    const bio = String(formData.get("bio") || "").trim();
    const backgroundConsent = Boolean(formData.get("backgroundConsent"));
    const termsConsent = Boolean(formData.get("termsConsent"));

    const nextErrors: FieldErrors = {};
    if (!name) nextErrors.name = "Full name is required.";
    if (!email) nextErrors.email = "Email address is required.";
    if (!rawPhone) nextErrors.phone = "Phone number is required.";
    if (!service) nextErrors.service = "Please select a service.";
    if (!experience) nextErrors.experience = "Experience is required.";
    if (!area) nextErrors.area = "Service area is required.";
    if (!availability) nextErrors.availability = "Please select availability.";
    if (!hasInsurance) nextErrors.insurance = "Please select an option.";
    if (!backgroundConsent)
      nextErrors.backgroundConsent = "Consent is required.";
    if (!termsConsent) nextErrors.termsConsent = "Consent is required.";

    if (rawPhone && !/^\+?\d{8,15}$/.test(sanitizedPhone)) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setError("Please fix the highlighted fields.");
      setFieldErrors(nextErrors);
      return;
    }

    try {
      const submitPromise = addDoc(collection(db, "providerApplications"), {
        name,
        email,
        phone: sanitizedPhone,
        service,
        experience,
        area,
        availability,
        hasInsurance,
        business,
        bio,
        backgroundConsent,
        termsConsent,
        status: "pending_verification",
        createdAt: serverTimestamp(),
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Submission timed out. Please try again.")),
          10000
        );
      });

      await Promise.race([submitPromise, timeoutPromise]);

      setStatus("success");
      (event.target as HTMLFormElement).reset();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.";
      setStatus("error");
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--prime-ink)]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
            Start application
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl">
            Tell us about your services.
          </h1>
          <p className="max-w-2xl text-sm text-[color:rgba(20,21,22,0.7)]">
            Complete this short form and we will reach out with next steps for
            verification.
          </p>
        </header>

        <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,42,34,0.12)]">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
              Full name
              <input
                name="name"
                type="text"
                placeholder="Amara Daniels"
                aria-invalid={Boolean(fieldErrors.name)}
                className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)] aria-[invalid=true]:border-red-400"
              />
            </label>
            {fieldErrors.name ? (
              <p className="text-xs text-red-600">{fieldErrors.name}</p>
            ) : null}
            <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
              Email address
              <input
                name="email"
                type="email"
                placeholder="you@domain.com"
                aria-invalid={Boolean(fieldErrors.email)}
                className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)] aria-[invalid=true]:border-red-400"
              />
            </label>
            {fieldErrors.email ? (
              <p className="text-xs text-red-600">{fieldErrors.email}</p>
            ) : null}
            <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
              Phone number
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9+ -]*"
                placeholder="+1 (555) 123-4567"
                aria-invalid={Boolean(fieldErrors.phone)}
                className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)] aria-[invalid=true]:border-red-400"
              />
            </label>
            {fieldErrors.phone ? (
              <p className="text-xs text-red-600">{fieldErrors.phone}</p>
            ) : null}
            <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
              Primary service
              <select
                name="service"
                defaultValue=""
                aria-invalid={Boolean(fieldErrors.service)}
                className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)] aria-[invalid=true]:border-red-400"
              >
                <option value="" disabled>
                  Select a service
                </option>
                {serviceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
              Years of experience
              <input
                name="experience"
                type="number"
                min="0"
                placeholder="3"
                aria-invalid={Boolean(fieldErrors.experience)}
                className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)] aria-[invalid=true]:border-red-400"
              />
            </label>
            {fieldErrors.experience ? (
              <p className="text-xs text-red-600">{fieldErrors.experience}</p>
            ) : null}
            <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
              Service area
              <input
                name="area"
                type="text"
                placeholder="Johannesburg Central"
                aria-invalid={Boolean(fieldErrors.area)}
                className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)] aria-[invalid=true]:border-red-400"
              />
            </label>
            {fieldErrors.area ? (
              <p className="text-xs text-red-600">{fieldErrors.area}</p>
            ) : null}
            <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
              Availability
              <select
                name="availability"
                defaultValue=""
                aria-invalid={Boolean(fieldErrors.availability)}
                className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)] aria-[invalid=true]:border-red-400"
              >
                <option value="" disabled>
                  Select availability
                </option>
                {availabilityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
              Do you have business insurance?
              <select
                name="insurance"
                defaultValue=""
                aria-invalid={Boolean(fieldErrors.insurance)}
                className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)] aria-[invalid=true]:border-red-400"
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
              Business name (optional)
              <input
                name="business"
                type="text"
                placeholder="Prime Clean Co."
                className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
              Short bio (optional)
              <textarea
                name="bio"
                rows={4}
                placeholder="Tell customers about your experience and specialties."
                className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--prime-forest)]"
              />
            </label>
            <label className="flex items-start gap-3 text-sm text-[color:rgba(20,21,22,0.75)]">
              <input
                name="backgroundConsent"
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--prime-forest)]"
              />
              I consent to a background check for verification.
            </label>
            {fieldErrors.backgroundConsent ? (
              <p className="text-xs text-red-600">
                {fieldErrors.backgroundConsent}
              </p>
            ) : null}
            <label className="flex items-start gap-3 text-sm text-[color:rgba(20,21,22,0.75)]">
              <input
                name="termsConsent"
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--prime-forest)]"
              />
              I agree to Prime Care provider terms and privacy policy.
            </label>
            {fieldErrors.termsConsent ? (
              <p className="text-xs text-red-600">{fieldErrors.termsConsent}</p>
            ) : null}

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {status === "success" ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Application received. We will contact you within 24 hours.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Submitting..." : "Submit application"}
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <button
            onClick={() => router.back()}
            className="font-semibold uppercase tracking-[0.2em] text-[var(--prime-copper)]"
          >
            Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="font-semibold uppercase tracking-[0.2em] text-[var(--prime-ink)]"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
