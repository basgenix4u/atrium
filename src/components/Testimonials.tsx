import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

const QUOTES = [
  {
    q: "We shortlisted seven estates across four countries without leaving Geneva. By the time we flew to Cap Ferrat, we already knew which rooms we would live in.",
    n: "Marguerite Delacroix",
    r: "Principal, Delacroix Family Office",
    c: "from-amber-200 to-amber-500",
    big: true,
  },
  {
    q: "The floor plans reconcile to the centimetre with the 3D model. That is rare. Atrium compressed our diligence from weeks into days.",
    n: "Julian Okoye",
    r: "Founding Partner, Okoye Capital",
    c: "from-stone-300 to-stone-600",
  },
  {
    q: "Our listings feel unmistakably elevated. Buyers arrive informed and serious — viewings are shorter and offers arrive faster.",
    n: "Isabella Marchetti",
    r: "Director, Marchetti & Co. Brokerage",
    c: "from-rose-200 to-rose-400",
  },
  {
    q: "Being able to explode a house into its floors and lift the roof is, finally, how architecture should be shared with the public.",
    n: "Takeshi Mori",
    r: "Architect, Kuro Atelier",
    c: "from-slate-300 to-slate-500",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" aria-labelledby="testi-title" className="relative bg-bone/60 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-gold-deep">In their words</p>
          <h2 id="testi-title" className="font-display mt-4 text-5xl leading-[1.02] sm:text-7xl">
            Quiet confidence, <em className="italic">repeated</em>.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-6">
          {QUOTES.map((t, i) => (
            <Reveal key={t.n} delay={i * 110} className={t.big ? "md:col-span-6 lg:col-span-3 lg:row-span-2" : "md:col-span-3 lg:col-span-3"}>
              <figure className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border p-8 transition-all duration-500 hover:-translate-y-1 sm:p-10 ${t.big ? "border-ink bg-ink text-ivory" : "border-ink/10 bg-white/70 hover:shadow-[0_30px_70px_-34px_rgba(90,60,10,0.4)]"}`}>
                {t.big && <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-gold/20 blur-3xl" />}
                <div className="relative">
                  <div className="flex items-center gap-1 text-gold" aria-label="Rated five out of five">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Icon key={k} name="star" className="size-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className={`font-display mt-6 leading-[1.18] ${t.big ? "text-3xl sm:text-5xl" : "text-2xl sm:text-[1.7rem]"}`}>
                    <span aria-hidden className="text-gold">“</span>
                    {t.q}
                    <span aria-hidden className="text-gold">”</span>
                  </blockquote>
                </div>
                <figcaption className="relative mt-8 flex items-center gap-4">
                  <span aria-hidden className={`grid size-12 place-items-center rounded-full bg-gradient-to-br ${t.c} font-display text-xl text-ink`}>
                    {t.n
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{t.n}</span>
                    <span className={`block text-xs ${t.big ? "text-ivory/55" : "text-mute"}`}>{t.r}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
