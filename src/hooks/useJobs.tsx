import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";

export type JobInput = {
  title: string;
  company: string;
  url?: string;
  notes?: string;
};

export type Job = JobInput & {
  id: string;
  createdAt: number;
  updatedAt: number;
};

type Ctx = {
  items: Job[];
  create: (input: JobInput) => Promise<void>;
  update: (id: string, patch: Partial<JobInput>) => Promise<void>;
  deleteJob: (id: string) => Promise<Job | undefined>;
  undoDelete: () => Promise<void>;
  getById: (id: string) => Job | undefined;

  exportJson: () => Promise<string>;
  importJson: (json: string, opts?: { merge?: boolean }) => Promise<void>;
  nukeStorage: () => Promise<void>;
  refresh: () => Promise<void>;
};

const JobsContext = React.createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "jobs.v1";

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Job[]>([]);
  const lastDeleted = React.useRef<Job | undefined>(undefined);

  const load = React.useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: Job[] = JSON.parse(raw);
      // basic shape guard
      if (Array.isArray(parsed)) {
        setItems(
          parsed
            .filter((j) => j && j.id && j.title && j.company)
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      }
    } catch {
      // ignore bad data
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const persist = React.useCallback(async (next: Job[]) => {
    setItems(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const create = React.useCallback(async (input: JobInput) => {
    const now = Date.now();
    const job: Job = {
      id: nanoid(),
      title: input.title.trim(),
      company: input.company.trim(),
      url: input.url?.trim(),
      notes: input.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    };
    await persist([job, ...items]);
  }, [items, persist]);

  const update = React.useCallback(async (id: string, patch: Partial<JobInput>) => {
    const now = Date.now();
    const next = items.map((j) =>
      j.id === id
        ? {
            ...j,
            ...("title" in patch ? { title: patch.title?.trim() ?? j.title } : {}),
            ...("company" in patch ? { company: patch.company?.trim() ?? j.company } : {}),
            ...("url" in patch ? { url: patch.url?.trim() || undefined } : {}),
            ...("notes" in patch ? { notes: (patch.notes ?? "").trim() || undefined } : {}),
            updatedAt: now,
          }
        : j
    );
    await persist(next);
  }, [items, persist]);

  const deleteJob = React.useCallback(async (id: string) => {
    const j = items.find((x) => x.id === id);
    if (!j) return undefined;
    lastDeleted.current = j;
    await persist(items.filter((x) => x.id !== id));
    return j;
  }, [items, persist]);

  const undoDelete = React.useCallback(async () => {
    if (!lastDeleted.current) return;
    const restored = lastDeleted.current;
    lastDeleted.current = undefined;
    await persist([restored, ...items]);
  }, [items, persist]);

  const getById = React.useCallback((id: string) => {
    return items.find((x) => x.id === id);
  }, [items]);

  // ----- Import / Export / Clear -----

  const exportJson = React.useCallback(async () => {
    // return JSON string; SettingsScreen will share it
    return JSON.stringify(items, null, 2);
  }, [items]);

  const importJson = React.useCallback(
    async (json: string, opts?: { merge?: boolean }) => {
      const incoming = JSON.parse(json) as Job[];
      if (!Array.isArray(incoming)) throw new Error("Invalid JSON");
      const clean = incoming
        .filter((j) => j && j.id && j.title && j.company)
        .map((j) => ({
          ...j,
          url: j.url || undefined,
          notes: j.notes || undefined,
        }));

      if (opts?.merge) {
        // merge by id (incoming wins)
        const map = new Map<string, Job>();
        for (const j of items) map.set(j.id, j);
        for (const j of clean) map.set(j.id, j);
        const next = Array.from(map.values()).sort(
          (a, b) => b.createdAt - a.createdAt
        );
        await persist(next);
      } else {
        // replace
        const next = clean.sort((a, b) => b.createdAt - a.createdAt);
        await persist(next);
      }
    },
    [items, persist]
  );

  const nukeStorage = React.useCallback(async () => {
    lastDeleted.current = undefined;
    await persist([]);
  }, [persist]);

  const refresh = React.useCallback(async () => {
    await load();
  }, [load]);

  const value: Ctx = {
    items,
    create,
    update,
    deleteJob,
    undoDelete,
    getById,
    exportJson,
    importJson,
    nukeStorage,
    refresh,
  };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs(): Ctx {
  const ctx = React.useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used within JobsProvider");
  return ctx;
}