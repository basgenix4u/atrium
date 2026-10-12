"use client";

import { useEffect, useState } from "react";
import { useAtrium } from "./AtriumProvider";
import { Icon, Logo } from "./Icons";

const LINKS = [
  { href: "#collection", label: "Collection" },
  { href: "#studio", label: "3D Studio" },
  { href: "#private-office", label: "Private Office" },
  { href: "#pricing", label: "Membership" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const { openAccess, unlocked } = useAtrium();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled || open ? "py-2.5" : "py-5"}`}>
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <nav
          aria-label="Primary"
          className={`relative flex items-center justify-between rounded-full px-4 py-2 text-ivory transition-all duration-500 sm:px-6 ${
            scrolled || open ? "glass !bg-ink/90" : "border border-transparent"
          }`}
        >
          <a href="#top" aria-label="Atrium — home" className="py-1">
            <Logo />
          </a>
          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="group relative rounded-full px-4 py-2 text-sm text-ivory/75 transition-colors hover:text-ivory">
                  {l.label}
                  <span className="absolute inset-x-4 bottom-1 h-px origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>
          <div className="hidden items-center gap-2.5 lg:flex">
            <button type="button" onClick={() => openAccess("enter")} className="btn btn-ghost-dark btn-sm">
              <Icon name={unlocked ? "key" : "lock"} className="size-4 text-gold" />
              {unlocked ? "Office unlocked" : "Private Office"}
            </button>
            <button type="button" onClick={() => openAccess("request")} className="btn btn-gold btn-sm">
              Request invitation
            </button>
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-white/15 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </nav>

        <div
          id="mobile-menu"
          className={`glass mt-2 origin-top overflow-hidden rounded-3xl !bg-ink/90 text-ivory transition-all duration-500 lg:hidden ${
            open ? "max-h-[32rem] opacity-100" : "pointer-events-none max-h-0 opacity-0"
          }`}
          aria-hidden={!open}
        >
          <ul className="grid p-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-base hover:bg-white/5">
                  {l.label}
                  <Icon name="arrow-right" className="size-4 text-gold" />
                </a>
              </li>
            ))}
          </ul>
          <div className="grid gap-2.5 p-3 pt-0">
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setOpen(false);
                openAccess("enter");
              }}
              className="btn btn-ghost-dark"
            >
              <Icon name="lock" className="size-4 text-gold" />
              {unlocked ? "Office unlocked" : "Enter Private Office"}
            </button>
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setOpen(false);
                openAccess("request");
              }}
              className="btn btn-gold"
            >
              Request invitation
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
