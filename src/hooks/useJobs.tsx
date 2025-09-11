// src/hooks/useJobs.ts
import * as React from "react";
import { usePersistedState } from "../store/persist";

export type Risk = "low" | "medium" | "high";

export type Job = {
  id: string;
  title: string;
  company: string;
  url?: string;
  notes?: string;
  // kept optional for backward-compat with older records/UI that might read it
  risk?: Risk;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
};

export type CreateJobInput = {
  title: string;
  company: string;
  url?: string;
  notes?: string;
  // allow writing old records that still pass risk
  risk?: Risk;
};

export type UpdateJobInput = Partial<Omit<CreateJobInput, "title" | "company">> & {
  title?: string;
  company?: string;
};

type Ctx = {
  items: Job[];
  create: (input: CreateJobInput) => Promise<Job>;
  update: (id: string, changes: UpdateJobInput) => Promise<Job | undefined>;
  remove: (id: string) => Promise<void>;
  /** Alias of `remove` for clarity at callsites like ReportDetailScreen */
  deleteJob: (id: string) => Promise<void>;
  getById: (id: string) => Job | undefined;
};

const JobsContext = React.createContext<Ctx | undefined>(undefined);

// simple stable id
const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = usePersistedState<Job[]>("jobs.items", []);

  const create = React.useCallback(async (input: CreateJobInput) => {
    const now = Date.now();
    const job: Job = {
      id: makeId(),
      title: input.title.trim(),
      company: input.company.trim(),
      url: input.url?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      risk: input.risk, // tolerated, not used by scoring anymore
      createdAt: now,
      updatedAt: now,
    };
    setItems((prev) => [job, ...prev]);
    return job;
  }, [setItems]);

  const update = React.useCallback(
    async (id: string, changes: UpdateJobInput) => {
      let updated: Job | undefined;
      setItems((prev) =>
        prev.map((j) => {
          if (j.id !== id) return j;
          updated = {
            ...j,
            title: changes.title?.trim() ?? j.title,
            company: changes.company?.trim() ?? j.company,
            url: changes.url?.trim() || undefined,
            notes: changes.notes?.trim() || undefined,
            // keep risk if present but do not require it
            risk: changes.risk ?? j.risk,
            updatedAt: Date.now(),
          };
          return updated!;
        })
      );
      return updated;
    },
    [setItems]
  );

  const remove = React.useCallback(async (id: string) => {
    setItems((prev) => prev.filter((j) => j.id !== id));
  }, [setItems]);

  // alias used by ReportDetailScreen
  const deleteJob = remove;

  const getById = React.useCallback(
    (id: string) => items.find((j) => j.id === id),
    [items]
  );

  const value: Ctx = { items, create, update, remove, deleteJob, getById };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs(): Ctx {
  const ctx = React.useContext(JobsContext);
  if (!ctx) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return ctx;
}