// IMPORTANT: set this to your Mac's LAN IP so the phone can reach it
const BASE = "http://192.168.1.76:4000";

export type ListParams = { risk?: "LOW" | "MEDIUM" | "HIGH"; search?: string };
export type JobInput = {
  title?: string;
  company?: string;
  url?: string | null;
  email?: string | null;
  source?: string | null;
  risk?: "LOW" | "MEDIUM" | "HIGH";
  score?: number;
  notes?: string | null;
  images?: string[];
};

async function okOrThrow(r: Response, label: string) {
  if (r.ok) return r;
  const body = await r.text().catch(() => "");
  throw new Error(`${label} failed: ${r.status} ${body}`);
}

export const api = {
  async list(params: ListParams = {}) {
    const qs = new URLSearchParams();
    if (params.risk) qs.set("risk", params.risk);
    if (params.search) qs.set("search", params.search.trim());
    const r = await fetch(`${BASE}/jobs${qs.toString() ? `?${qs}` : ""}`);
    await okOrThrow(r, "list");
    return r.json();
  },

  async create(data: Required<Pick<JobInput, "title" | "company">> & JobInput) {
    const r = await fetch(`${BASE}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await okOrThrow(r, "create");
    return r.json();
  },

  async update(id: string, data: JobInput) {
    const r = await fetch(`${BASE}/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await okOrThrow(r, "update");
    return r.json();
  },

  async remove(id: string) {
    const r = await fetch(`${BASE}/jobs/${id}`, { method: "DELETE" });
    await okOrThrow(r, "remove");
    return r.json();
  },

  async bulkDelete(ids: string[]) {
    const r = await fetch(`${BASE}/jobs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    await okOrThrow(r, "bulkDelete");
    return r.json();
  },
};