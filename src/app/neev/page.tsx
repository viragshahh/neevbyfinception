import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finception Outreach: Neev | Finception",
  description: "Finception's financial literacy outreach initiative, distinct from the NEEV investment initiative.",
};

const PILLARS = [
  {
    title: "Financial Literacy",
    description:
      "Simplifying budgeting, saving, credit and investing for students and communities with little to no formal exposure to personal finance.",
  },
  {
    title: "Community Outreach",
    description:
      "Taking structured, easy-to-follow financial education sessions beyond campus to schools and underserved communities around Gurgaon.",
  },
  {
    title: "Peer Mentorship",
    description:
      "Pairing GLIM students with participants for ongoing guidance, well after a single workshop ends.",
  },
  {
    title: "Measurable Impact",
    description:
      "Tracking outcomes such as workshops delivered, participants reached, and follow-on engagement rather than vanity metrics.",
  },
];

export default function NeevPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="font-label text-[11px] text-accent">FINCEPTION INITIATIVE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Neev <span className="text-muted">by Finception — Outreach</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          This page describes Finception&apos;s financial literacy outreach initiative. It is separate from
          NEEV, the student-managed Indian equity investment initiative governed by the NEEV Fund Charter.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-accent">Our Mission</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            To make financial literacy accessible and practical for students, first-time
            earners and underserved communities - through simple, jargon-free workshops on
            budgeting, saving, credit and investing that translate directly into everyday
            financial decisions.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-accent">Our Vision</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A community where sound financial decision-making is not a privilege reserved for
            the few, but a foundational life skill available to everyone - built one
            session, one mentee, and one household at a time.
          </p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">What Neev stands for</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="card p-5">
              <h3 className="text-base font-semibold text-foreground">{pillar.title}</h3>
              <p className="mt-2 text-sm text-muted">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
