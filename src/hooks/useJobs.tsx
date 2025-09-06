// src/hooks/useJobs.tsx
import * as React from "react";
import { loadJobs, saveJobs } from "../store/persist";

/** Domain types */
export type Risk = "low" | "medium" | "high";

export type Job = {
  id: string;
  title: string;
  company: string;
  url?: string | null;
  notes?: string | null;
  risk: Risk;
  /** canonical epoch ms */
  createdAt: number;
};

export type JobInput = {
  title: string;
  company: string;
  url?: string | undefined;
  notes?: string | undefined;
  risk: Risk;
};

export type JobPatch = Partial<JobInput>;

/** Context shape */
type JobsCtx = {
  items: Job[];
  refresh: () => Promise<void>;
  create: (input: JobInput) => Promise<Job>;
  update: (id: string, patch: JobPatch) => Promise<Job>;
  remove: (id: string) => Promise<void>;
};

const Ctx = React.createContext<JobsCtx | null>(null);

/** Provider (now in TSX) */
export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Job[]>([]);

  // initial load
  React.useEffect(() => {
    (async () => {
      const loaded = await loadJobs(); // ensures createdAt is number
      setItems(loaded);
    })();
  }, []);

  const refresh = React.useCallback(async () => {
    const loaded = await loadJobs();
    setItems(loaded);
  }, []);

  const create = React.useCallback(async (input: JobInput): Promise<Job> => {
    const job: Job = {
      id: Math.random().toString(36).slice(2),
      title: input.title.trim(),
      company: input.company.trim(),
      url: input.url?.trim() || null,
      notes: input.notes?.trim() || null,
      risk: input.risk,
      createdAt: Date.now(),
    };
    setItems(prev => {
      const next = [job, ...prev];
      saveJobs(next).catch(() => {});
      return next;
    });
    return job;
  }, []);

  const update = React.useCallback(async (id: string, patch: JobPatch) => {
    let updated!: Job;
    setItems(prev => {
      const next = prev.map(j => {
        if (j.id !== id) return j;
        updated = {
          ...j,
          title: patch.title?.trim() ?? j.title,
          company: patch.company?.trim() ?? j.company,
          url: (patch.url?.trim() ?? j.url) || null,
          notes: (patch.notes?.trim() ?? j.notes) || null,
          risk: patch.risk ?? j.risk,
        };
        return updated;
      });
      saveJobs(next).catch(() => {});
      return next;
    });
    return updated;
  }, []);

  const remove = React.useCallback(async (id: string) => {
    setItems(prev => {
      const next = prev.filter(j => j.id !== id);
      saveJobs(next).catch(() => {});
      return next;
    });
  }, []);

  const value = React.useMemo<JobsCtx>(
    () => ({ items, refresh, create, update, remove }),
    [items, refresh, create, update, remove]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Hook */
export function useJobs(): JobsCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useJobs must be used within a JobsProvider");
  return ctx;
}