// src/hooks/useJobs.tsx
import * as React from "react";

/** Types */
export type Job = {
  id: string;
  title: string;
  company: string;
  url?: string;
  notes?: string;
  createdAt: number;   // epoch ms
  updatedAt?: number;  // epoch ms
};

export type JobInput = Omit<Job, "id" | "createdAt" | "updatedAt">;
export type JobPatch = Partial<JobInput>;

type JobsContext = {
  items: Job[];
  getById: (id: string) => Job | undefined;
  create: (input: JobInput) => Promise<Job>;
  update: (id: string, patch: JobPatch) => Promise<Job>;
  remove: (id: string) => Promise<void>;
  // Back-compat alias (some screens call deleteJob):
  deleteJob: (id: string) => Promise<void>;
};

const Ctx = React.createContext<JobsContext | null>(null);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Job[]>([]);

  const getById = React.useCallback(
    (id: string) => items.find((j) => j.id === id),
    [items]
  );

  const create = React.useCallback(async (input: JobInput) => {
    const now = Date.now();
    const job: Job = {
      id: Math.random().toString(36).slice(2),
      title: input.title,
      company: input.company,
      url: input.url,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    setItems((prev) => [job, ...prev]);
    return job;
  }, []);

  const update = React.useCallback(async (id: string, patch: JobPatch) => {
    const now = Date.now();
    let next: Job | undefined;
    setItems((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        next = {
          ...j,
          ...patch,
          updatedAt: now,
        };
        return next!;
      })
    );
    if (!next) throw new Error("Job not found");
    return next;
  }, []);

  const remove = React.useCallback(async (id: string) => {
    setItems((prev) => prev.filter((j) => j.id !== id));
  }, []);

  // Back-compat alias for existing callers
  const deleteJob = React.useCallback(
    async (id: string) => remove(id),
    [remove]
  );

  const value = React.useMemo(
    () => ({ items, getById, create, update, remove, deleteJob }),
    [items, getById, create, update, remove, deleteJob]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJobs() {
  const ctx = React.useContext(Ctx);
  if (!ctx) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return ctx;
}