"use client";

import { useId, useState } from "react";
import { FAQS } from "@/lib/faq";
import { useAtrium } from "./AtriumProvider";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  const { openEnquiry } = useAtrium();

  return (
    <section id="faq" aria-labelledby="faq-title" className="relative bg-bone/60 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[22rem_1fr]">
        <Reveal>
          <p className="eyebrow text-gold-deep">Questions</p>
          <h2 id="faq-title" className="font-display mt-4 text-5xl leading-[1.02] sm:text-6xl">
            Everything you may wish to ask.
          </h2>
          <p className="mt-5 text-mute">Something more particular? Your advisor will answer in confidence.</p>
          <button type="button" onClick={() => openEnquiry(null, "consultation")} className="btn btn-dark btn-sm mt-6">
            Ask an advisor <Icon name="arrow-right" className="size-4" />
          </button>
        </Reveal>

        <Reveal delay={120}>
          <ul className="divide-y divide-ink/10 overflow-hidden rounded-[2rem] border border-ink/10 bg-white/70">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <li key={f.q}>
                  <h3>
                    <button type="button" id={`${base}-q${i}`} aria-expanded={isOpen} aria-controls={`${base}-a${i}`} onClick={() => setOpen(isOpen ? null : i)} className="group flex w-full items-center justify-between gap-6 px-6 py-6 text-left transition-colors hover:bg-white sm:px-8">
                      <span className="font-display text-2xl leading-snug sm:text-[1.75rem]">{f.q}</span>
                      <span className={`grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-500 ${isOpen ? "rotate-45 border-gold bg-gold text-ink" : "border-ink/15 group-hover:border-ink/40"}`}>
                        <Icon name="plus" className="size-4" />
                      </span>
                    </button>
                  </h3>
                  <div id={`${base}-a${i}`} role="region" aria-labelledby={`${base}-q${i}`} className={`grid transition-all duration-500 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <p className="max-w-2xl px-6 pb-7 text-base leading-relaxed text-mute sm:px-8">{f.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
