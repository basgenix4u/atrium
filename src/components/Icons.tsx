import type { ReactNode, SVGProps } from "react";

const P = {
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-up-right": <path d="M7 17L17 7M8 7h9v9" />,
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  lock: (
    <>
      <path d="M7 11V8a5 5 0 0110 0v3" />
      <rect x="5" y="11" width="14" height="10" rx="2" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M16 7l3 3" />
    </>
  ),
  cube: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5" />,
  layers: <path d="M12 3l9 5-9 5-9-5 9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5" />,
  plan: <path d="M4 4h16v16H4zM4 12h8M12 4v8M12 16h8M16 12v8" />,
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <path d="M4 4l16 16" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
  dusk: <path d="M3 18h18M7 18a5 5 0 0110 0M12 6v3M5 10l2 2M19 10l-2 2" />,
  person: (
    <>
      <circle cx="12" cy="7" r="3" />
      <path d="M6 21v-4a6 6 0 0112 0v4" />
    </>
  ),
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.7 2 2 .7-2 .7L19 22l-.7-2.6-2-.7 2-.7L19 16z" />,
  building: <path d="M5 21V5l8-2v18M13 9l6 2v10M9 8h.01M9 12h.01M9 16h.01M3 21h18" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  mail: <path d="M3 6h18v12H3zM3 7l9 7 9-7" />,
  door: <path d="M6 21V4h12v17M4 21h16M14 12h.01" />,
  exploded: <path d="M12 3l7 3.5-7 3.5-7-3.5L12 3zM5 11l7 3.5 7-3.5M5 16l7 3.5 7-3.5" />,
  xray: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 3" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </>
  ),
  roof: <path d="M3 12l9-8 9 8M6 10v10h12V10" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  left: <path d="M19 12H5M11 6l-6 6 6 6" />,
  right: <path d="M5 12h14M13 6l6 6-6 6" />,
  quote: <path d="M7 17c-2 0-3-1.5-3-3.5C4 10 6 7 9 6M17 17c-2 0-3-1.5-3-3.5 0-3.5 2-6.5 5-7.5" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  ruler: <path d="M3 17L17 3l4 4L7 21l-4-4zM8 12l2 2M11 9l2 2M14 6l2 2" />,
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof P;

export function Icon({ name, className = "size-5", ...rest }: { name: IconName; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {P[name]}
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0dfb4" />
            <stop offset="1" stopColor="#b08d4d" />
          </linearGradient>
        </defs>
        <path d="M4 28V12L16 4l12 8v16" fill="none" stroke="url(#lg)" strokeWidth="1.8" />
        <path d="M10 28V15l6-4 6 4v13" fill="none" stroke="url(#lg)" strokeWidth="1.8" />
        <path d="M14 28v-8h4v8" fill="url(#lg)" />
      </svg>
      <span className="font-display text-[1.65rem] font-medium leading-none tracking-[0.22em]">ATRIUM</span>
    </span>
  );
}
