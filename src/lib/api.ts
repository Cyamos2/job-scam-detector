import Constants from "expo-constants";

const BASE =
  process.env.EXPO_PUBLIC_API_BASE ||
  (Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_API_BASE ||
  "http://localhost:4000";

export type Job = {
  id: string;
  title: string;
  company: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  score: number;
  source?: string | null;
  url?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt: string;
  images: { id: string; uri: string; jobId: string }[];
};

export type JobInput = {
  title: string;
  company: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  score: number;
  source?: string | null;
  url?: string | null;
  email?: string | null;
  notes?: string | null;
  images?: string[];
};

function qs(params: Record<string, any> = {}) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : "";
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  return (await res.json().catch(() => ({}))) as T;
}

export const api = {
  list: (p: { risk?: "LOW" | "MEDIUM" | "HIGH"; search?: string; limit?: number; offset?: number } = {}) =>
    http<{ items: Job[]; total: number }>(`/jobs${qs(p)}`),

  create: (input: JobInput) =>
    http<Job>("/jobs", { method: "POST", body: JSON.stringify(input) }),

  update: (id: string, input: Partial<JobInput>) =>
    http<Job>(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

  replace: (id: string, input: JobInput) =>
    http<Job>(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(input) }),

  remove: (id: string) =>
    fetch(`${BASE}/jobs/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    }),
};