"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Property, Teaser } from "@/lib/types";
import { EnquiryModal, PrivateOfficeModal } from "./Modals";

export type StudioTab = "explore" | "plans" | "map" | "details";

interface Ctx {
  properties: Property[];
  teasers: Teaser[];
  unlocked: boolean;
  email: string | null;
  active: Property;
  tab: StudioTab;
  setTab: (t: StudioTab) => void;
  setActive: (id: number) => void;
  openStudio: (id: number, tab?: StudioTab) => void;
  openEnquiry: (propertyId?: number | null, kind?: string) => void;
  openAccess: (mode?: "enter" | "request") => void;
  unlock: (email: string, props: Property[]) => void;
  lock: () => Promise<void>;
  saved: number[];
  toggleSaved: (id: number) => void;
}

const AtriumContext = createContext<Ctx | null>(null);

export function useAtrium() {
  const c = useContext(AtriumContext);
  if (!c) throw new Error("useAtrium must be used within AtriumProvider");
  return c;
}

export function AtriumProvider({
  publicProperties,
  privateProperties,
  teasers,
  initialEmail,
  children,
}: {
  publicProperties: Property[];
  privateProperties: Property[];
  teasers: Teaser[];
  initialEmail: string | null;
  children: ReactNode;
}) {
  const [priv, setPriv] = useState<Property[]>(privateProperties);
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [activeId, setActiveId] = useState<number>(publicProperties[0]?.id ?? 0);
  const [tab, setTab] = useState<StudioTab>("explore");
  const [saved, setSaved] = useState<number[]>([]);
  const [access, setAccess] = useState<{ open: boolean; mode: "enter" | "request" }>({ open: false, mode: "enter" });
  const [enquiry, setEnquiry] = useState<{ open: boolean; propertyId: number | null; kind: string }>({ open: false, propertyId: null, kind: "viewing" });

  const properties = useMemo(() => [...publicProperties, ...priv], [publicProperties, priv]);
  const active = properties.find((p) => p.id === activeId) ?? properties[0];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("atrium:saved");
      if (raw) setSaved(JSON.parse(raw) as number[]);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleSaved = useCallback((id: number) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem("atrium:saved", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const openStudio = useCallback((id: number, t: StudioTab = "explore") => {
    setActiveId(id);
    setTab(t);
    window.setTimeout(() => document.getElementById("studio")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  }, []);

  const unlock = useCallback((em: string, props: Property[]) => {
    setPriv(props);
    setEmail(em);
  }, []);

  const lock = useCallback(async () => {
    try {
      await fetch("/api/private-office", { method: "DELETE" });
    } catch {
      /* offline – still lock locally */
    }
    setPriv([]);
    setEmail(null);
    setActiveId((cur) => (publicProperties.some((p) => p.id === cur) ? cur : publicProperties[0]?.id ?? cur));
  }, [publicProperties]);

  const value: Ctx = {
    properties,
    teasers,
    unlocked: !!email,
    email,
    active,
    tab,
    setTab,
    setActive: setActiveId,
    openStudio,
    openEnquiry: (propertyId = null, kind = "viewing") => setEnquiry({ open: true, propertyId, kind }),
    openAccess: (mode = "enter") => setAccess({ open: true, mode }),
    unlock,
    lock,
    saved,
    toggleSaved,
  };

  return (
    <AtriumContext.Provider value={value}>
      {children}
      <PrivateOfficeModal open={access.open} mode={access.mode} onMode={(m) => setAccess({ open: true, mode: m })} onClose={() => setAccess((a) => ({ ...a, open: false }))} />
      <EnquiryModal open={enquiry.open} propertyId={enquiry.propertyId} kind={enquiry.kind} onClose={() => setEnquiry((e) => ({ ...e, open: false }))} />
    </AtriumContext.Provider>
  );
}
