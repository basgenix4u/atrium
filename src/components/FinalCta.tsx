import Image from "next/image";

import { AccessRequestForm } from "./Modals";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

export function FinalCta() {
  return (
    <section id="invitation" aria-labelledby="cta-title" className="grain relative isolate overflow-hidden bg-ink py-24 text-ivory sm:py-32">
      <Image src="/images/sunset.jpg" alt="" aria-hidden="true" fill sizes="100vw" className="absolute inset-0 -z-20 object-cover opacity-35" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-transparent to-ink" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow flex items-center gap-3 text-gold-soft">
            <span className="h-px w-10 bg-gold" /> By invitation
          </p>
          <h2 id="cta-title" className="font-display mt-5 text-6xl leading-[0.98] sm:text-8xl">
            Your invitation is <em className="gold-text italic">waiting</em>.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ivory/70">Join a private circle of buyers, families and advisors who experience the world&apos;s great homes before the world does.</p>
          <ul className="mt-9 grid gap-4 text-sm">
            {["A personal reply from a senior advisor within one business day", "Access to the off-market portfolio once verified", "No obligation, no marketing lists, complete discretion"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-ivory/80">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold/20 text-gold">
                  <Icon name="check" className="size-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={150}>
          <div className="glass rounded-[2rem] p-6 sm:p-9">
            <h3 className="font-display text-3xl">Request an invitation</h3>
            <p className="mb-6 mt-1 text-sm text-ivory/55">Tell us a little about you. All details are confidential.</p>
            <AccessRequestForm dark />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
