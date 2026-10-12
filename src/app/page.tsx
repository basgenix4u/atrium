import { cookies } from "next/headers";
import { Audiences } from "@/components/Audiences";
import { AtriumProvider } from "@/components/AtriumProvider";
import { Collection } from "@/components/Collection";
import { Faq } from "@/components/Faq";
import { Features } from "@/components/Features";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { Pricing } from "@/components/Pricing";
import { PrivateOffice } from "@/components/PrivateOffice";
import { SocialProof } from "@/components/SocialProof";
import { Studio } from "@/components/Studio";
import { Testimonials } from "@/components/Testimonials";
import { PO_COOKIE, verifySession } from "@/lib/auth";
import { FAQS } from "@/lib/faq";
import { loadAllProperties, splitProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const all = await loadAllProperties();
  const { pub, priv, teasers } = splitProperties(all);
  const jar = await cookies();
  const session = verifySession(jar.get(PO_COOKIE)?.value);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "Atrium", description: "A private digital gallery for $10M+ residences, experienced in interactive 3D.", url: "https://atrium.estate" },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <AtriumProvider publicProperties={pub} privateProperties={session ? priv : []} teasers={teasers} initialEmail={session?.email ?? null}>
      <a href="#main" className="sr-only z-[100] rounded-full bg-gold px-5 py-3 font-medium text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <SocialProof />
        <Features />
        <Collection />
        <Studio />
        <Audiences />
        <PrivateOffice />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </AtriumProvider>
  );
}
