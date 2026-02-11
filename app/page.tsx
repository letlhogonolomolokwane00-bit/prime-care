"use client";

import { useRouter } from "next/navigation";

const services = [
  {
    title: "Home Cleaning",
    description: "Deep cleans, recurring upkeep, move-in or move-out refreshes.",
    tag: "From 2 hrs",
  },
  {
    title: "Plumbing & Repairs",
    description: "Leaks, installations, water heaters, and urgent fixes.",
    tag: "Emergency-ready",
  },
  {
    title: "Electrical Work",
    description: "Lighting, outlets, rewiring, and safety inspections.",
    tag: "Licensed pros",
  },
  {
    title: "Caregiving",
    description: "Trusted support for seniors, kids, and daily routines.",
    tag: "Background-checked",
  },
  {
    title: "Handyman",
    description: "Assembly, mounting, repairs, and small renovations.",
    tag: "Same-day slots",
  },
  {
    title: "Outdoor Care",
    description: "Gardening, lawn service, and seasonal maintenance.",
    tag: "Weekly plans",
  },
];

const steps = [
  {
    title: "Choose a service",
    description: "Browse vetted providers with transparent pricing and reviews.",
  },
  {
    title: "Book in minutes",
    description: "Select a time, add details, and get instant confirmation.",
  },
  {
    title: "Relax at home",
    description: "Track arrivals, message providers, and pay securely.",
  },
];

const metrics = [
  { value: "4.9", label: "Average customer rating" },
  { value: "12k+", label: "Verified providers onboarded" },
  { value: "30 min", label: "Average booking time" },
];

const trust = [
  "Vetted professionals",
  "Secure payments",
  "Live support",
  "Insurance coverage",
  "Real-time tracking",
  "Flexible rescheduling",
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(70,182,143,0.35),_rgba(70,182,143,0)_70%)]" />
          <div className="absolute left-[-10%] top-20 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(196,122,79,0.3),_rgba(196,122,79,0)_70%)]" />
          <div className="absolute bottom-[-140px] right-[10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(15,42,34,0.25),_rgba(15,42,34,0)_70%)]" />
        </div>

        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--prime-forest)] text-white">
              <span className="text-lg font-semibold">PC</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--prime-copper)]">
                Prime Care
              </p>
              <p className="text-sm text-[var(--prime-ink)]">Home Services</p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-[var(--prime-ink)] md:flex">
            <a className="hover:text-[var(--prime-copper)]" href="#services">
              Services
            </a>
            <a className="hover:text-[var(--prime-copper)]" href="#how-it-works">
              How it works
            </a>
            <a className="hover:text-[var(--prime-copper)]" href="#trust">
              Trust & Safety
            </a>
            <button
              onClick={() => router.push("/provider/auth")}
              className="rounded-full border border-[var(--prime-ink)] px-5 py-2 text-sm transition hover:border-transparent hover:bg-[var(--prime-ink)] hover:text-white"
            >
              Join as provider
            </button>
          </nav>
        </header>

        <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-20 pt-10 md:flex-row md:items-center md:gap-10">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full bg-[var(--prime-cream)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--prime-forest)]">
              <span className="h-2 w-2 rounded-full bg-[var(--prime-mint)]" />
              Trusted Home Services
            </div>
            <h1 className="font-serif text-4xl leading-tight text-[var(--prime-ink)] sm:text-5xl lg:text-6xl">
              Premium home care, booked in minutes and delivered with precision.
            </h1>
            <p className="max-w-xl text-lg text-[color:rgba(20,21,22,0.75)]">
              Prime Care connects you to vetted professionals for cleaning, repairs,
              caregiving, and more. Transparent pricing, live support, and a
              seamless booking flow built for modern households.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => router.push("/sign-in")}
                className="rounded-full bg-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--prime-ink)]"
              >
                Book a service
              </button>
              <button
                onClick={() => router.push("/services")}
                className="rounded-full border border-[var(--prime-forest)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--prime-forest)] transition hover:bg-[var(--prime-forest)] hover:text-white"
              >
                Explore services
              </button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-[color:rgba(20,21,22,0.7)]">
              {metrics.map((metric) => (
                <div key={metric.label} className="min-w-[140px]">
                  <p className="text-2xl font-semibold text-[var(--prime-ink)]">
                    {metric.value}
                  </p>
                  <p>{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex-1">
            <div className="relative rounded-[36px] border border-white/80 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,42,34,0.18)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--prime-copper)]">
                    Upcoming Booking
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--prime-ink)]">
                    Home Cleaning
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--prime-sand)] px-3 py-1 text-xs font-semibold text-[var(--prime-forest)]">
                  10:30 AM Today
                </span>
              </div>
              <div className="mt-6 grid gap-4 rounded-2xl bg-[var(--prime-cream)] p-4">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-[color:rgba(20,21,22,0.7)]">Provider</p>
                  <p className="font-semibold text-[var(--prime-ink)]">
                    Amara D. • 5.0
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-[color:rgba(20,21,22,0.7)]">Address</p>
                  <p className="font-semibold text-[var(--prime-ink)]">
                    24 Parkview Lane
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-[color:rgba(20,21,22,0.7)]">Total</p>
                  <p className="font-semibold text-[var(--prime-ink)]">$128.00</p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--prime-forest)] text-white">
                  <span className="text-sm font-semibold">AD</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--prime-ink)]">
                    Tracking enabled
                  </p>
                  <p className="text-xs text-[color:rgba(20,21,22,0.6)]">
                    Arriving in 18 minutes
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 hidden rounded-3xl border border-white/70 bg-white/60 px-6 py-4 text-sm text-[var(--prime-ink)] shadow-[0_18px_40px_rgba(15,42,34,0.15)] backdrop-blur md:block">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--prime-copper)]">
                Coverage
              </p>
              <p className="mt-2 text-lg font-semibold">12 neighborhoods live</p>
              <p className="text-xs text-[color:rgba(20,21,22,0.6)]">
                More cities launching weekly
              </p>
            </div>
          </div>
        </section>
      </div>

      <section
        id="services"
        className="mx-auto w-full max-w-6xl px-6 py-20"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--prime-copper)]">
              Services
            </p>
            <h2 className="font-serif text-3xl text-[var(--prime-ink)] sm:text-4xl">
              Everything your home needs, in one place.
            </h2>
          </div>
          <p className="max-w-md text-sm text-[color:rgba(20,21,22,0.7)]">
            From recurring upkeep to urgent repairs, Prime Care gives you access
            to trusted professionals with clear pricing and quality guarantees.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="group rounded-[28px] border border-white/60 bg-white/70 p-6 shadow-[0_16px_40px_rgba(15,42,34,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,42,34,0.12)]"
            >
              <span className="inline-flex items-center rounded-full bg-[var(--prime-sand)] px-3 py-1 text-xs font-semibold text-[var(--prime-forest)]">
                {service.tag}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-[var(--prime-ink)]">
                {service.title}
              </h3>
              <p className="mt-2 text-sm text-[color:rgba(20,21,22,0.7)]">
                {service.description}
              </p>
              <button
                onClick={() =>
                  router.push(
                    `/providers?service=${encodeURIComponent(service.title)}`
                  )
                }
                className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--prime-copper)]"
              >
                View providers
              </button>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-[var(--prime-cream)]"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-20 md:flex-row">
          <div className="flex-1 space-y-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--prime-copper)]">
              How it works
            </p>
            <h2 className="font-serif text-3xl text-[var(--prime-ink)] sm:text-4xl">
              A booking flow built for calm, not chaos.
            </h2>
            <p className="max-w-md text-sm text-[color:rgba(20,21,22,0.7)]">
              Every step is transparent. You see who is coming, what it costs,
              and when they arrive, with support whenever you need it.
            </p>
            <div className="grid gap-4 rounded-[28px] border border-[var(--prime-sand)] bg-white/80 p-6 text-sm text-[var(--prime-ink)]">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Instant booking</p>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--prime-copper)]">
                  24/7
                </span>
              </div>
              <p className="text-[color:rgba(20,21,22,0.65)]">
                Smart matching pairs you with the best available pro.
              </p>
            </div>
          </div>
          <div className="flex-1 space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[26px] border border-white/60 bg-white/70 p-6 shadow-[0_12px_30px_rgba(15,42,34,0.08)]"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--prime-forest)] text-sm font-semibold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-semibold text-[var(--prime-ink)]">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm text-[color:rgba(20,21,22,0.7)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--prime-copper)]">
              Trust & Safety
            </p>
            <h2 className="font-serif text-3xl text-[var(--prime-ink)] sm:text-4xl">
              A network built on safety, accountability, and care.
            </h2>
            <p className="max-w-lg text-sm text-[color:rgba(20,21,22,0.7)]">
              We screen every provider, require background checks, and continuously
              monitor quality. Your home is protected by secure payments and
              on-demand support.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {trust.map((item) => (
                <div
                  key={item}
                  className="rounded-[18px] border border-[var(--prime-sand)] bg-[var(--prime-cream)] px-4 py-3 text-sm font-medium text-[var(--prime-ink)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,42,34,0.12)]">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--prime-copper)]">
                Live support
              </p>
              <span className="rounded-full bg-[var(--prime-sand)] px-3 py-1 text-xs font-semibold text-[var(--prime-forest)]">
                24/7
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-[var(--prime-ink)]">
              Dedicated care team, always on.
            </h3>
            <p className="text-sm text-[color:rgba(20,21,22,0.7)]">
              Our care specialists stay with you from booking to completion to
              ensure every service meets Prime Care standards.
            </p>
            <div className="mt-4 grid gap-4 rounded-2xl bg-[var(--prime-cream)] p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-[color:rgba(20,21,22,0.7)]">Response time</p>
                <p className="font-semibold text-[var(--prime-ink)]">Under 2 min</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[color:rgba(20,21,22,0.7)]">Resolution rate</p>
                <p className="font-semibold text-[var(--prime-ink)]">98%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--prime-forest)] text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-6 py-16 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-[rgba(255,255,255,0.7)]">
            Ready to book
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl">
            Experience the calm of a well-cared-for home.
          </h2>
          <p className="max-w-2xl text-sm text-[rgba(255,255,255,0.72)]">
            Join thousands of households trusting Prime Care for consistent,
            professional service. Launching in more cities every week.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => router.push("/auth/sign-up")}
              className="rounded-full bg-white px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--prime-forest)]"
            >
              Get started
            </button>
            <button
              onClick={() => router.push("/provider/auth")}
              className="rounded-full border border-white/60 px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-[var(--prime-forest)]"
            >
              Become a provider
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/60 bg-[var(--prime-cream)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-[color:rgba(20,21,22,0.7)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--prime-copper)]">
              Prime Care
            </p>
            <p className="mt-2 max-w-sm">
              Your trusted marketplace for premium, on-demand home services.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.2em] text-[var(--prime-ink)]">
            <a href="#services" className="hover:text-[var(--prime-copper)]">
              Services
            </a>
            <a href="#how-it-works" className="hover:text-[var(--prime-copper)]">
              How it works
            </a>
            <a href="#trust" className="hover:text-[var(--prime-copper)]">
              Trust
            </a>
            <span>Launching soon</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
