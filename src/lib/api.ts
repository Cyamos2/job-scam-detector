// src/lib/api.ts

/**
 * API type surface for the app.
 * We re-export types from useJobs to ensure consistency everywhere,
 * so there’s only one definition of Job, JobInput, and JobPatch.
 */

export type { Job, JobInput, JobPatch } from "../hooks/useJobs";

// Re-export Severity as Risk for compatibility
export type { Severity as Risk } from "./scoring";

/**
 * Example placeholder API functions.
 * Replace with real API calls if you connect to a backend later.
 */

/**
 * Upload jobs to a server (no-op for now).
 */
export async function syncUp(jobs: ReadonlyArray<import("../hooks/useJobs").Job>): Promise<void> {
  // TODO: implement actual API sync (network call)
  // For now, this is a no-op placeholder
  return;
}

/**
 * Download jobs from a server (no-op for now).
 */
export async function syncDown(): Promise<ReadonlyArray<import("../hooks/useJobs").Job>> {
  // TODO: implement actual API fetch
  // For now, just return an empty array
  return [];
}