export function formatPrice(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  return `$${Math.round(n / 1000)}K`;
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function sqftToSqm(n: number): number {
  return n / 10.7639;
}

export function priceBand(n: number): string {
  const lo = Math.floor(n / 10_000_000) * 10;
  return `$${lo}–${lo + 10}M`;
}
