import * as React from "react";
import { api, ListParams } from "../lib/api";

export type Risk = "LOW" | "MEDIUM" | "HIGH" | "ALL";

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function useJobs() {
  const [risk, setRisk] = React.useState<Risk>("ALL");
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounced(search, 300);

  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchJobs = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: ListParams = {};
      if (risk !== "ALL") params.risk = risk;
      if (debouncedSearch.trim()) params.search = debouncedSearch;
      const data = await api.list(params);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [risk, debouncedSearch]);

  React.useEffect(() => { fetchJobs(); }, [fetchJobs]);

  return {
    items, loading, error,
    risk, setRisk,
    search, setSearch,
    refetch: fetchJobs,
  };
}