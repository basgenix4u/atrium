import { CountUp, Reveal } from "./Reveal";
import { Icon } from "./Icons";

const NAMES = [
  "Halden & Voss Capital",
  "Maison Delacroix",
  "Sotheran Private Office",
  "Northvale Partners",
  "Kestrel Family Office",
  "Brandt Architekten",
  "Meridian Wealth",
  "Okoye + Lindqvist",
  "Whitcombe & Ash",
  "Aurora Holdings",
];

const METRICS = [
  { to: 1240, suffix: "+", label: "Verified principals & advisors", icon: "shield" as const },
  { to: 94, suffix: "%", label: "of buyers tour in 3D before a site visit", icon: "cube" as const },
  { to: 62, suffix: "%", label: "fewer flights to shortlist a property", icon: "globe" as const },
  { to: 11, suffix: " days", label: "median time from tour to private viewing", icon: "key" as const },
];

export function SocialProof() {
  return (
    <section id="social-proof" aria-labelledby="proof-title" className="relative bg-ivory py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-gold-deep">Trusted without introduction</p>
          <h2 id="proof-title" className="font-display mt-4 text-4xl leading-[1.05] sm:text-6xl">
            The families, funds and houses that <em className="italic">rarely</em> need to look twice.
          </h2>
        </Reveal>

        <div className="relative mt-14 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]" aria-label="Partners and advisors who use Atrium">
          <ul className="animate-marquee flex w-max gap-14 whitespace-nowrap py-3">
            {[...NAMES, ...NAMES].map((n, i) => (
              <li key={`${n}-${i}`} aria-hidden={i >= NAMES.length} className="font-display flex items-center gap-14 text-2xl tracking-wide text-ink/45 sm:text-3xl">
                {n}
                <span className="size-1.5 rotate-45 bg-gold" />
              </li>
            ))}
          </ul>
        </div>

        <dl className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <Reveal key={m.label} delay={i * 90} className="group bg-ivory p-7 transition-colors duration-500 hover:bg-white sm:p-9">
              <Icon name={m.icon} className="size-6 text-gold-deep transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110" />
              <dd className="font-display mt-6 text-5xl sm:text-6xl">
                <CountUp to={m.to} suffix={m.suffix} />
              </dd>
              <dt className="mt-2 text-sm leading-snug text-mute">{m.label}</dt>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
