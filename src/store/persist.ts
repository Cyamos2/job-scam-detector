// src/store/persist.ts
import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Job } from "../hooks/useJobs";

/** Storage keys */
const JOBS_KEY = "@jobs.v1";

/* =========================
   Core persistence (Jobs)
   ========================= */

export async function loadJobs(): Promise<Job[]> {
  try {
    const raw = await AsyncStorage.getItem(JOBS_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Normalize shape defensively
    return (parsed as Partial<Job>[]).map((j, i) => ({
      id: String(j.id ?? `m-${i}-${Date.now()}`),
      title: String(j.title ?? "Untitled"),
      company: String(j.company ?? "Unknown"),
      risk:
        j.risk === "high" || j.risk === "medium" || j.risk === "low"
          ? j.risk
          : "low",
      url: j.url ?? null,
      notes: j.notes ?? null,
      // createdAt in-app is epoch ms (number)
      createdAt:
        typeof j.createdAt === "number"
          ? j.createdAt
          : Number(j.createdAt) || Date.now(),
    }));
  } catch {
    return [];
  }
}

export async function saveJobs(jobs: ReadonlyArray<Job>): Promise<void> {
  const json = JSON.stringify(jobs);
  await AsyncStorage.setItem(JOBS_KEY, json);
}

export async function clearJobs(): Promise<void> {
  await AsyncStorage.removeItem(JOBS_KEY);
}

/* =========================
   Export / Import (JSON)
   ========================= */

export async function exportJobs(): Promise<string> {
  const jobs = await loadJobs();
  return JSON.stringify({ version: 1, jobs }, null, 2);
}

export async function importJobs(json: string): Promise<void> {
  const parsed = JSON.parse(json);
  const arr = Array.isArray(parsed) ? parsed : parsed?.jobs;
  if (!Array.isArray(arr)) {
    throw new Error("Import JSON must contain an array of jobs");
  }

  const jobs: Job[] = arr.map((j: any, i: number) => ({
    id: String(j.id ?? `im-${i}-${Date.now()}`),
    title: String(j.title ?? "Untitled"),
    company: String(j.company ?? "Unknown"),
    risk:
      j.risk === "high" || j.risk === "medium" || j.risk === "low"
        ? j.risk
        : "low",
    url: j.url ?? null,
    notes: j.notes ?? null,
    createdAt:
      typeof j.createdAt === "number"
        ? j.createdAt
        : Number(j.createdAt) || Date.now(),
  }));

  await saveJobs(jobs);
}

/* =========================================
   Generic tiny persisted-state hook (UI)
   ========================================= */

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

/**
 * Persist a small piece of UI state in AsyncStorage.
 * Example:
 *   const [sortBy, setSortBy] =
 *     usePersistedState<"score"|"date"|"title">("db.sort","score");
 */
export function usePersistedState<T>(key: string, initial: T): [T, Setter<T>] {
  const [state, setState] = React.useState<T>(initial);

  // initial load
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (mounted && raw != null) {
          setState(JSON.parse(raw) as T);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [key]);

  // persist on change
  React.useEffect(() => {
    AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => {});
  }, [key, state]);

  return [state, setState];
}