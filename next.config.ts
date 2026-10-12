import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Referrer policy for privacy
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict powerful features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  // Force HTTPS (when deployed behind HTTPS)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Security: enforce type safety in builds
  typescript: {
    ignoreBuildErrors: false,
  },
  // Don't expose source maps in production
  productionBrowserSourceMaps: false,
  // Performance: gzip/brotli-compress all responses
  compress: true,
  // Performance: serve AVIF/WebP, cache optimized images for a year
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [64, 96, 128, 256],
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
