import React from "react";
import { Alert } from "react-native";

export type Job = {
  id: string;
  title: string;
  company: string;
  url?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type JobInput = {
  title: string;
  company: string;
  url?: string;
  notes?: string;
};

export type JobPatch = Partial<JobInput>;

type PendingDelete = {
  job: Job;
  originalIndex: number;
  expiresAt: number; // epoch ms
  timer?: ReturnType<typeof setTimeout>;
};

type Ctx = {
  items: Job[];
  create(input: JobInput): Promise<Job>;
  update(id: string, patch: JobPatch): Promise<void>;
  deleteJob(id: string): Promise<void>;
  undoDelete(): void;
  pendingDelete: PendingDelete | null;
  getById(id: string): Job | undefined;
  replaceAll(next: Job[]): void; // (used by screens that resort)
};

const JobsContext = React.createContext<Ctx | null>(null);

export function useJobs(): Ctx {
  const ctx = React.useContext(JobsContext);
  if (!ctx) {
    throw new Error("useJobs must be used within JobsProvider");
  }
  return ctx;
}

const UNDO_MS = 6000;

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Job[]>([]);
  const [pendingDelete, setPendingDelete] = React.useState<PendingDelete | null>(null);

  // helper
  const getById = React.useCallback((id: string) => items.find(j => j.id === id), [items]);

  const create = React.useCallback(async (input: JobInput) => {
    const now = Date.now();
    const job: Job = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title.trim(),
      company: input.company.trim(),
      url: input.url?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    setItems(prev => [job, ...prev]);
    return job;
  }, []);

  const update = React.useCallback(async (id: string, patch: JobPatch) => {
    const now = Date.now();
    setItems(prev =>
      prev.map(j =>
        j.id === id
          ? {
              ...j,
              ...patch,
              title: patch.title?.trim() ?? j.title,
              company: patch.company?.trim() ?? j.company,
              url: patch.url?.trim() || undefined,
              notes: patch.notes?.trim() || undefined,
              updatedAt: now,
            }
          : j
      )
    );
  }, []);

  // Soft delete with Undo window
  const deleteJob = React.useCallback(async (id: string) => {
    // If another pending delete exists, finalize it first
    setPendingDelete(prev => {
      if (prev?.timer) clearTimeout(prev.timer);
      return null;
    });

    setItems(prev => {
      const idx = prev.findIndex(j => j.id === id);
      if (idx < 0) return prev;
      const job = prev[idx];

      const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      const pd: PendingDelete = {
        job,
        originalIndex: idx,
        expiresAt: Date.now() + UNDO_MS,
      };
      pd.timer = setTimeout(() => {
        // when time elapses, commit by clearing pending
        setPendingDelete(null);
      }, UNDO_MS);
      setPendingDelete(pd);

      return next;
    });
  }, []);

  const undoDelete = React.useCallback(() => {
    setPendingDelete(prev => {
      if (!prev) return null;
      if (prev.timer) clearTimeout(prev.timer);

      setItems(cur => {
        const idx = Math.min(Math.max(prev.originalIndex, 0), cur.length);
        const next = [...cur];
        next.splice(idx, 0, prev.job);
        return next;
      });

      return null;
    });
  }, []);

  const replaceAll = React.useCallback((next: Job[]) => setItems(next), []);

  // Safety: if component unmounts, clear timer
  React.useEffect(() => {
    return () => {
      if (pendingDelete?.timer) clearTimeout(pendingDelete.timer);
    };
  }, [pendingDelete]);

  const value: Ctx = {
    items,
    create,
    update,
    deleteJob,
    undoDelete,
    pendingDelete,
    getById,
    replaceAll,
  };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}