"use client";

import { useAtrium } from "./AtriumProvider";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

export function Pricing() {
  const { openAccess, openEnquiry } = useAtrium();

  const plans = [
    {
      name: "Gallery",
      tag: "For explorers & enthusiasts",
      price: "Complimentary",
      sub: "Always free",
      features: ["Full 3D explorer on every public residence", "Floor plans with live dimensions", "Interactive maps & neighbourhood data", "Private shortlist across devices", "Architect and atelier profiles"],
      cta: "Start exploring",
      action: () => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" }),
      featured: false,
    },
    {
      name: "Private Office",
      tag: "For principals & family offices",
      price: "By invitation",
      sub: "Complimentary for verified principals",
      features: ["Everything in Gallery", "Confidential off-market portfolio", "Exact coordinates & full dossiers", "A dedicated personal advisor", "Discreet viewings & acquisition support", "Priority access to new mandates"],
      cta: "Request an invitation",
      action: () => openAccess("request"),
      featured: true,
    },
    {
      name: "Showroom",
      tag: "For brokers & developers",
      price: "from $4,900",
      sub: "per listing · verified digital twin included",
      features: ["Measured 3D twin delivered in 10 days", "Branded private showroom & links", "Qualified international buyer network", "Private & off-market listing controls", "Engagement analytics by room", "Dedicated onboarding team"],
      cta: "Speak with partnerships",
      action: () => openEnquiry(null, "consultation"),
      featured: false,
    },
  ];

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="relative bg-ivory py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-gold-deep">Membership</p>
          <h2 id="pricing-title" className="font-display mt-4 text-5xl leading-[1.02] sm:text-7xl">
            Free to admire. <em className="italic">Invited</em> to acquire.
          </h2>
          <p className="mt-5 text-lg text-mute">Buyers never pay to view. Brokers and developers invest in a presentation that sells.</p>
        </Reveal>

        <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 120} className="h-full">
              <div className={`relative flex h-full flex-col rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-1.5 sm:p-10 ${p.featured ? "bg-ink text-ivory shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)] lg:-my-4 lg:py-14" : "border border-ink/10 bg-white/70 hover:shadow-[0_30px_70px_-36px_rgba(90,60,10,0.4)]"}`}>
                {p.featured && (
                  <>
                    <div aria-hidden className="absolute inset-0 overflow-hidden rounded-[2rem]">
                      <div className="absolute -right-20 -top-20 size-72 rounded-full bg-gold/25 blur-3xl" />
                    </div>
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-gold-soft to-gold px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink">Most chosen</span>
                  </>
                )}
                <div className="relative flex flex-1 flex-col">
                  <p className={`eyebrow !text-[0.66rem] ${p.featured ? "text-gold-soft" : "text-gold-deep"}`}>{p.tag}</p>
                  <h3 className="font-display mt-3 text-4xl">{p.name}</h3>
                  <p className="font-display mt-5 text-5xl leading-none">{p.price}</p>
                  <p className={`mt-2 text-sm ${p.featured ? "text-ivory/55" : "text-mute"}`}>{p.sub}</p>
                  <ul className="mt-8 grid flex-1 content-start gap-3.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm leading-snug">
                        <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${p.featured ? "bg-gold/25 text-gold-soft" : "bg-gold/25 text-gold-deep"}`}>
                          <Icon name="check" className="size-3" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={p.action} className={`btn mt-10 w-full ${p.featured ? "btn-gold" : "btn-dark"}`}>
                    {p.cta}
                    <Icon name="arrow-right" className="size-4" />
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-mute">All plans include end-to-end encrypted enquiries and a signed non-disclosure for off-market material.</p>
      </div>
    </section>
  );
}
