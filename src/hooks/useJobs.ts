import * as React from "react";
import { api, type Job, type JobInput } from "@/lib/api";

export function useJobs() {
  const [items, setItems] = React.useState<Job[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [risk, setRisk] = React.useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");
  const [search, setSearch] = React.useState("");

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const q = { risk: risk === "ALL" ? undefined : risk, search };
      const data = await api.list(q);
      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      setError(e?.message ?? "Network request failed");
    } finally {
      setLoading(false);
    }
  }, [risk, search]);

  const create = React.useCallback(async (input: JobInput) => {
    const created = await api.create(input);
    setItems((s) => [created, ...s]);
    setTotal((t) => t + 1);
  }, []);

  const update = React.useCallback(async (id: string, patch: Partial<JobInput>) => {
    setItems((s) => s.map((j) => (j.id === id ? { ...j, ...patch } as any : j)));
    try {
      const saved = await api.update(id, patch);
      setItems((s) => s.map((j) => (j.id === id ? saved : j)));
    } catch (e) {
      // refetch on failure
      await refresh();
      throw e;
    }
  }, [refresh]);

  const remove = React.useCallback(async (id: string) => {
    const prev = items;
    setItems((s) => s.filter((j) => j.id !== id));
    setTotal((t) => Math.max(0, t - 1));
    try {
      await api.remove(id);
    } catch (e) {
      // rollback
      setItems(prev);
      setTotal(prev.length);
      throw e;
    }
  }, [items]);

  React.useEffect(() => { refresh(); }, [refresh]);

  return { items, total, loading, error, risk, setRisk, search, setSearch, refresh, create, update, remove };
}