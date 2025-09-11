// ...existing imports...
import * as React from "react";
import { saveJobs, loadJobs } from "../store/persist"; // or whatever your persist helpers are named

export type Risk = "low" | "medium" | "high";
export type Job = {
  id: string;
  title: string;
  company: string;
  url?: string;
  risk: Risk;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
};

type Ctx = {
  items: Job[];
  create: (payload: Omit<Job, "id" | "createdAt" | "updatedAt">) => Promise<Job>;
  update: (id: string, changes: Partial<Omit<Job, "id" | "createdAt">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Job | undefined;
};

const JobsContext = React.createContext<Ctx | undefined>(undefined);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Job[]>([]);

  // initial load
  React.useEffect(() => {
    (async () => {
      try {
        const raw = await loadJobs();
        if (raw) setItems(raw);
      } catch {}
    })();
  }, []);

  const persist = React.useCallback(async (next: Job[]) => {
    setItems(next);
    try { await saveJobs(next); } catch {}
  }, []);

  const create = React.useCallback<Ctx["create"]>(async (payload) => {
    const j: Job = {
      id: Math.random().toString(36).slice(2),
      createdAt: Date.now(),
      ...payload,
    };
    const next = [j, ...items];
    await persist(next);
    return j;
  }, [items, persist]);

  // ✅ NEW: update
  const update = React.useCallback<Ctx["update"]>(async (id, changes) => {
    const next = items.map((j) =>
      j.id === id ? { ...j, ...changes, updatedAt: Date.now() } : j
    );
    await persist(next);
  }, [items, persist]);

  const remove = React.useCallback<Ctx["remove"]>(async (id) => {
    const next = items.filter((j) => j.id !== id);
    await persist(next);
  }, [items, persist]);

  // ✅ NEW: helper
  const getById = React.useCallback((id: string) => items.find((j) => j.id === id), [items]);

  const value: Ctx = { items, create, update, remove, getById };
  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const ctx = React.useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used inside JobsProvider");
  return ctx;
}