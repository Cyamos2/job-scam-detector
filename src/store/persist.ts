// src/store/persist.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Job } from "../lib/api";

const KEY = "scamicide.jobs.v1";

// read all jobs from storage
export async function loadJobs(): Promise<Job[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // guard: only accept arrays
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// write all jobs to storage
export async function saveJobs(jobs: Job[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(jobs));
  } catch {
    // no-op
  }
}

// quick helpers for export/import
export async function exportJobs(): Promise<string> {
  const jobs = await loadJobs();
  return JSON.stringify(jobs, null, 2);
}

export async function importJobs(json: string): Promise<Job[]> {
  const arr = JSON.parse(json);
  if (!Array.isArray(arr)) throw new Error("Invalid JSON (expected an array).");
  // very light shape check
  const cleaned = arr.filter(
    (j) => j && typeof j.id === "string" && typeof j.title === "string" && typeof j.company === "string"
  );
  await saveJobs(cleaned);
  return cleaned as Job[];
}