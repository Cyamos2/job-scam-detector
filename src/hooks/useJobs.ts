// src/hooks/useJobs.ts
import * as React from "react";
import { api, type Job, type JobInput } from "../lib/api";

export function useJobs() {
  const [items, setItems] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listJobs(); // returns Job[]
      setItems(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const refresh = load;

  // convenience helpers (optional)
  const create = React.useCallback(async (input: JobInput) => {
    const created = await api.createJob(input);
    setItems((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = React.useCallback(async (id: string, patch: Partial<JobInput>) => {
    const updated = await api.updateJob(id, patch);
    setItems((prev) => prev.map((j) => (j.id === id ? updated : j)));
    return updated;
  }, []);

  const remove = React.useCallback(async (id: string) => {
    await api.deleteJob(id);
    setItems((prev) => prev.filter((j) => j.id !== id));
  }, []);

  return { items, loading, error, refresh, create, update, remove };
}