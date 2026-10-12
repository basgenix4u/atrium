"use client";

import { useAtrium } from "./AtriumProvider";
import { Icon, Logo } from "./Icons";

export function Footer() {
  const { openAccess, openEnquiry } = useAtrium();
  const col = "grid content-start gap-3 text-sm text-ivory/60";
  const link = "w-fit transition-colors hover:text-gold-soft";
  return (
    <footer className="relative bg-ink-2 pb-10 pt-20 text-ivory">
      <div aria-hidden className="absolute inset-x-0 top-0 hairline" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo className="text-gold-soft" />
            <p className="font-display mt-6 max-w-sm text-3xl leading-tight text-ivory/90">The private digital gallery for the world&apos;s finest homes.</p>
            <button type="button" onClick={() => openEnquiry(null, "consultation")} className="btn btn-ghost-dark btn-sm mt-7">
              <Icon name="mail" className="size-4 text-gold" /> concierge@atrium.estate
            </button>
          </div>
          <nav aria-label="Explore" className={col}>
            <h2 className="eyebrow !text-[0.66rem] mb-1 text-gold-soft">Explore</h2>
            <a className={link} href="#collection">The collection</a>
            <a className={link} href="#studio">3D studio</a>
            <a className={link} href="#experience">Experience</a>
            <a className={link} href="#benefits">Who it&apos;s for</a>
          </nav>
          <nav aria-label="Membership" className={col}>
            <h2 className="eyebrow !text-[0.66rem] mb-1 text-gold-soft">Membership</h2>
            <button type="button" className={`${link} text-left`} onClick={() => openAccess("enter")}>Private Office</button>
            <button type="button" className={`${link} text-left`} onClick={() => openAccess("request")}>Request invitation</button>
            <a className={link} href="#pricing">Plans</a>
            <button type="button" className={`${link} text-left`} onClick={() => openEnquiry(null, "consultation")}>For brokers &amp; developers</button>
          </nav>
          <nav aria-label="Company" className={col}>
            <h2 className="eyebrow !text-[0.66rem] mb-1 text-gold-soft">Company</h2>
            <a className={link} href="#testimonials">Testimonials</a>
            <a className={link} href="#faq">FAQ</a>
            <a className={link} href="#invitation">Contact</a>
            <span>Geneva · London · New York · Dubai · Tokyo</span>
          </nav>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-xs text-ivory/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Atrium Estates SA. All rights reserved.</p>
          <p>Residences shown are illustrative digital models. Photography by Pexels contributors. Not an offer or financial advice.</p>
        </div>
      </div>
    </footer>
  );
}
