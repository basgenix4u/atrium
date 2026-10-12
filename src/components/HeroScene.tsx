"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelSpec } from "@/lib/types";
import { ViewerEngine } from "@/lib/viewer/engine";

/** A slowly orbiting, live-rendered residence used as the hero backdrop. */
export default function HeroScene({ model }: { model: ModelSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let engine: ViewerEngine | null = null;
    let raf = 0;
    try {
      engine = new ViewerEngine(host, { hero: true });
      engine.setTime("dusk");
      engine.load(model);
      raf = requestAnimationFrame(() => setReady(true));
    } catch {
      setReady(false);
    }
    return () => {
      cancelAnimationFrame(raf);
      engine?.dispose();
    };
  }, [model]);

  return <div ref={ref} aria-hidden="true" className={`absolute inset-0 z-[1] transition-opacity duration-[2000ms] ease-out ${ready ? "opacity-100" : "opacity-0"}`} />;
}
