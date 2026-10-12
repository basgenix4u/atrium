import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/inter";
import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Atrium — Private Estates, Experienced in 3D",
  description:
    "Atrium is the private digital gallery for $10M+ residences. Step inside interactive 3D models, study floor plans, explore live maps and unlock off-market estates through the Private Office.",
  keywords: ["luxury real estate", "$10M homes", "3D property tours", "off-market estates", "private office", "ultra-prime property"],
  openGraph: {
    title: "Atrium — Private Estates, Experienced in 3D",
    description: "Enter the world's finest residences before you ever board a plane.",
    type: "website",
    images: [{ url: "/images/aurelia.jpg", width: 1200, height: 800, alt: "A cliffside modernist villa above the Pacific" }],
  },
  twitter: { card: "summary_large_image", title: "Atrium — Private Estates, Experienced in 3D" },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <noscript>
          <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
