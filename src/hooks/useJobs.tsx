import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";

export type Risk = "low" | "medium" | "high";

export type JobInput = {
  title: string;
  company: string;
  location?: string;
  url?: string;
  notes?: string;
  risk?: Risk;
};

export type JobPatch = Partial<JobInput>;

export type Job = JobInput & {
  id: string;
  createdAt: number;
  updatedAt: number;
};

type LastDeleted = { id: string; snapshot: Job } | null;

type Ctx = {
  items: Job[];
  create: (input: JobInput) => Promise<void>;
  update: (id: string, patch: Partial<JobInput>) => Promise<void>;
  deleteJob: (id: string) => Promise<Job | undefined>;

  // Undo (context-managed so the UI can show a snackbar)
  lastDeleted: LastDeleted;
  restoreLastDeleted: () => Promise<void>;
  clearUndoFlag: () => void;

  // Back-compat shortcut (calls restoreLastDeleted)
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
  const [lastDeleted, setLastDeleted] = React.useState<LastDeleted>(null);

  const load = React.useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: Job[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setItems(
          parsed
            .filter((j) => j && j.id && j.title && j.company)
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      }
    } catch {
      /* ignore malformed data */
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const persist = React.useCallback(async (next: Job[]) => {
    setItems(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const create = React.useCallback(
    async (input: JobInput) => {
      const now = Date.now();
      const job: Job = {
        id: nanoid(),
        title: input.title.trim(),
        company: input.company.trim(),
        location: input.location?.trim(),
        url: input.url?.trim(),
        notes: input.notes?.trim(),
        risk: input.risk ?? "low",
        createdAt: now,
        updatedAt: now,
      };
      await persist([job, ...items]);
    },
    [items, persist]
  );

  const update = React.useCallback(
    async (id: string, patch: Partial<JobInput>) => {
      const now = Date.now();
      const next = items.map((j) =>
        j.id === id
          ? {
              ...j,
              ...("title" in patch ? { title: patch.title?.trim() ?? j.title } : {}),
              ...("company" in patch ? { company: patch.company?.trim() ?? j.company } : {}),
              ...("url" in patch ? { url: patch.url?.trim() || undefined } : {}),
              ...("notes" in patch ? { notes: (patch.notes ?? "").trim() || undefined } : {}),
              ...("risk" in patch ? { risk: patch.risk ?? j.risk ?? "low" } : {}),
              updatedAt: now,
            }
          : j
      );
      await persist(next);
    },
    [items, persist]
  );

  const deleteJob = React.useCallback(
    async (id: string) => {
      const j = items.find((x) => x.id === id);
      if (!j) return undefined;
      setLastDeleted({ id, snapshot: j });
      await persist(items.filter((x) => x.id !== id));
      return j;
    },
    [items, persist]
  );

  const restoreLastDeleted = React.useCallback(async () => {
    setLastDeleted((ld) => {
      if (!ld) return ld;
      const next = [ld.snapshot, ...items].sort((a, b) => b.createdAt - a.createdAt);
      // persist with the restored item
      persist(next);
      return null;
    });
  }, [items, persist]);

  const clearUndoFlag = React.useCallback(() => setLastDeleted(null), []);

  // Back-compat helper
  const undoDelete = React.useCallback(async () => {
    await restoreLastDeleted();
  }, [restoreLastDeleted]);

  const getById = React.useCallback(
    (id: string) => items.find((x) => x.id === id),
    [items]
  );

  // ----- Import / Export / Clear -----

  const exportJson = React.useCallback(async () => JSON.stringify(items, null, 2), [items]);

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
        const map = new Map<string, Job>();
        for (const j of items) map.set(j.id, j);
        for (const j of clean) map.set(j.id, j);
        const next = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
        await persist(next);
      } else {
        const next = clean.sort((a, b) => b.createdAt - a.createdAt);
        await persist(next);
      }
    },
    [items, persist]
  );

  const nukeStorage = React.useCallback(async () => {
    setLastDeleted(null);
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
    lastDeleted,
    restoreLastDeleted,
    clearUndoFlag,
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