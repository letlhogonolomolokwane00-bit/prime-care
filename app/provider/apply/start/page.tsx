"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

type Status = "idle" | "loading" | "success" | "error";
type FieldErrors = Partial<Record<string, string>>;

type UploadedDocument = {
  name: string;
  url: string;
  path: string;
  contentType: string;
  size: number;
};

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

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_DOC_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const ACCEPTED_SELFIE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getFileFromFormData(formData: FormData, key: string): File | null {
  const entry = formData.get(key);
  if (!(entry instanceof File) || !entry.name || entry.size === 0) {
    return null;
  }
  return entry;
}

function validateFile(
  file: File,
  allowedTypes: string[],
  fieldKey: string,
  fieldLabel: string,
  errors: FieldErrors
) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    errors[fieldKey] = `${fieldLabel} must be 10MB or less.`;
    return;
  }

  if (file.type && !allowedTypes.includes(file.type)) {
    errors[fieldKey] = `${fieldLabel} must be a PDF, JPG, PNG, or WEBP file.`;
  }
}

async function uploadDocument(
  providerId: string,
  folder: string,
  file: File
): Promise<UploadedDocument> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `providerApplications/${providerId}/${folder}/${uniqueId}-${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, {
    contentType: file.type || "application/octet-stream",
  });

  const url = await getDownloadURL(storageRef);

  return {
    name: file.name,
    url,
    path,
    contentType: file.type || "application/octet-stream",
    size: file.size,
  };
}

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

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStatus("error");
      setError("You need to sign in before submitting your application.");
      return;
    }

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

    const idDocument = getFileFromFormData(formData, "idDocument");
    const selfie = getFileFromFormData(formData, "selfie");
    const proofOfAddress = getFileFromFormData(formData, "proofOfAddress");
    const consentForm = getFileFromFormData(formData, "consentForm");
    const certificationEntries = formData.getAll("certifications");
    const certifications = certificationEntries.filter(
      (entry): entry is File =>
        entry instanceof File && Boolean(entry.name) && entry.size > 0
    );

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

    if (!idDocument) {
      nextErrors.idDocument = "Government ID upload is required.";
    }
    if (!selfie) {
      nextErrors.selfie = "A selfie is required.";
    }
    if (!proofOfAddress) {
      nextErrors.proofOfAddress = "Proof of address is required.";
    }
    if (!consentForm) {
      nextErrors.consentForm = "Signed consent form is required.";
    }

    if (idDocument) {
      validateFile(
        idDocument,
        ACCEPTED_DOC_TYPES,
        "idDocument",
        "ID document",
        nextErrors
      );
    }
    if (selfie) {
      validateFile(
        selfie,
        ACCEPTED_SELFIE_TYPES,
        "selfie",
        "Selfie",
        nextErrors
      );
    }
    if (proofOfAddress) {
      validateFile(
        proofOfAddress,
        ACCEPTED_DOC_TYPES,
        "proofOfAddress",
        "Proof of address",
        nextErrors
      );
    }
    if (consentForm) {
      validateFile(
        consentForm,
        ACCEPTED_DOC_TYPES,
        "consentForm",
        "Consent form",
        nextErrors
      );
    }

    for (const file of certifications) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        nextErrors.certifications = "Each certification file must be 10MB or less.";
        break;
      }
      if (file.type && !ACCEPTED_DOC_TYPES.includes(file.type)) {
        nextErrors.certifications =
          "Certification files must be PDF, JPG, PNG, or WEBP.";
        break;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setError("Please fix the highlighted fields.");
      setFieldErrors(nextErrors);
      return;
    }

    try {
      const [idDocumentUpload, selfieUpload, proofOfAddressUpload, consentFormUpload] =
        await Promise.all([
          uploadDocument(currentUser.uid, "id", idDocument as File),
          uploadDocument(currentUser.uid, "selfie", selfie as File),
          uploadDocument(currentUser.uid, "proof-of-address", proofOfAddress as File),
          uploadDocument(currentUser.uid, "consent-form", consentForm as File),
        ]);

      const certificationUploads = await Promise.all(
        certifications.map((file) =>
          uploadDocument(currentUser.uid, "certifications", file)
        )
      );

      await addDoc(collection(db, "providerApplications"), {
        providerUid: currentUser.uid,
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
        documents: {
          idDocument: idDocumentUpload,
          selfie: selfieUpload,
          proofOfAddress: proofOfAddressUpload,
          consentForm: consentFormUpload,
          certifications: certificationUploads,
        },
        status: "manual_review_pending",
        reviewRequired: true,
        createdAt: serverTimestamp(),
      });

      setStatus("success");
      router.push("/provider/application");
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
            Complete this form and upload your documents for manual review.
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
            {fieldErrors.service ? (
              <p className="text-xs text-red-600">{fieldErrors.service}</p>
            ) : null}
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
            {fieldErrors.availability ? (
              <p className="text-xs text-red-600">{fieldErrors.availability}</p>
            ) : null}
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
            {fieldErrors.insurance ? (
              <p className="text-xs text-red-600">{fieldErrors.insurance}</p>
            ) : null}
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

            <div className="space-y-4 rounded-2xl border border-[var(--prime-sand)] bg-[var(--prime-cream)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--prime-copper)]">
                Required documents
              </p>

              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Government ID upload
                <input
                  name="idDocument"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  aria-invalid={Boolean(fieldErrors.idDocument)}
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[var(--prime-forest)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.14em] file:text-white"
                />
              </label>
              {fieldErrors.idDocument ? (
                <p className="text-xs text-red-600">{fieldErrors.idDocument}</p>
              ) : null}

              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Selfie
                <input
                  name="selfie"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  aria-invalid={Boolean(fieldErrors.selfie)}
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[var(--prime-forest)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.14em] file:text-white"
                />
              </label>
              {fieldErrors.selfie ? (
                <p className="text-xs text-red-600">{fieldErrors.selfie}</p>
              ) : null}

              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Proof of address
                <input
                  name="proofOfAddress"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  aria-invalid={Boolean(fieldErrors.proofOfAddress)}
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[var(--prime-forest)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.14em] file:text-white"
                />
              </label>
              {fieldErrors.proofOfAddress ? (
                <p className="text-xs text-red-600">{fieldErrors.proofOfAddress}</p>
              ) : null}

              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Signed consent form
                <input
                  name="consentForm"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  aria-invalid={Boolean(fieldErrors.consentForm)}
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[var(--prime-forest)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.14em] file:text-white"
                />
              </label>
              {fieldErrors.consentForm ? (
                <p className="text-xs text-red-600">{fieldErrors.consentForm}</p>
              ) : null}

              <label className="grid gap-2 text-sm font-medium text-[var(--prime-ink)]">
                Certifications (optional)
                <input
                  name="certifications"
                  type="file"
                  multiple
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  aria-invalid={Boolean(fieldErrors.certifications)}
                  className="rounded-2xl border border-[var(--prime-sand)] bg-white px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[var(--prime-forest)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.14em] file:text-white"
                />
              </label>
              {fieldErrors.certifications ? (
                <p className="text-xs text-red-600">{fieldErrors.certifications}</p>
              ) : null}
              <p className="text-xs text-[color:rgba(20,21,22,0.65)]">
                Allowed file types: PDF, JPG, PNG, WEBP. Maximum size per file: 10MB.
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm text-[color:rgba(20,21,22,0.75)]">
              <input
                name="backgroundConsent"
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--prime-forest)]"
              />
              I consent to a background check for verification.
            </label>
            {fieldErrors.backgroundConsent ? (
              <p className="text-xs text-red-600">{fieldErrors.backgroundConsent}</p>
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
                Application and documents received. Your profile is now queued for manual review.
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
