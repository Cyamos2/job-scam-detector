// src/lib/api.ts

/**
 * API type surface for the app.
 * We re-export types from useJobs to ensure consistency everywhere,
 * so there’s only one definition of Job, JobInput, and JobPatch.
 */

export type { Job, JobInput, JobPatch } from "../hooks/useJobs";

// Re-export Severity as Risk for compatibility
export type { Severity as Risk } from "./scoring";

import api from "./db";

/**
 * Upload jobs to a server. This naively POSTs jobs that don't exist server-side.
 * In a real app you'd handle deduplication, conflict resolution, and batching.
 */
export async function syncUp(jobs: ReadonlyArray<import("../hooks/useJobs").Job>): Promise<void> {
  for (const j of jobs) {
    try {
      await api.create({ title: j.title, company: j.company, url: j.url, risk: j.risk ?? "low", notes: j.notes });
    } catch {
      // best-effort: ignore individual failures for now
    }
  }
}

/**
 * Download jobs from a server and convert to local Job shape (timestamps as numbers).
 */
export async function syncDown(): Promise<ReadonlyArray<import("../hooks/useJobs").Job>> {
  try {
    const remote = await api.listJobs();
    return remote.map((r) => ({
      id: r.id,
      title: r.title,
      company: r.company,
      url: r.url ?? undefined,
      notes: r.notes ?? undefined,
      createdAt: new Date(r.createdAt).getTime(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).getTime() : new Date(r.createdAt).getTime(),
    }));
  } catch {
    return [];
  }
} 