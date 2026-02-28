// src/lib/db.ts
import Constants from "expo-constants";

export type Risk = "low" | "medium" | "high";

export type Job = {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  recruiterEmail?: string | null;
  url?: string | null;
  risk: Risk;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type JobInput = {
  title: string;
  company: string;
  location?: string;
  recruiterEmail?: string;
  url?: string;
  risk?: Risk;
  notes?: string;
};

// Base URL for API - can be configured via environment or extra in app.json
function getBaseUrl(): string {
  const extra = (Constants?.expoConfig?.extra ?? {}) as Record<string, unknown>;
  if (extra.API_URL) return String(extra.API_URL);
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  
  // Default for local development
  return "http://127.0.0.1:3000";
}

const BASE_URL = getBaseUrl();
const API_PREFIX = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // canonical methods
  listJobs: (): Promise<Job[]> => request<Job[]>("/jobs"),
  createJob: (input: JobInput): Promise<Job> =>
    request<Job>("/jobs", { method: "POST", body: JSON.stringify(input) }),
  updateJob: (id: string, patch: Partial<JobInput>): Promise<Job> =>
    request<Job>(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteJob: (id: string): Promise<{ ok: true }> =>
    request<{ ok: true }>(`/jobs/${id}`, { method: "DELETE" }),
  verifyCompany: (target: string) =>
    request(`/verify?target=${encodeURIComponent(target)}`),
  patterns: (params: { company?: string; url?: string; recruiterEmail?: string }) => {
    const qs = new URLSearchParams();
    if (params.company) qs.set("company", params.company);
    if (params.url) qs.set("url", params.url);
    if (params.recruiterEmail) qs.set("recruiterEmail", params.recruiterEmail);
    return request<{ success: true; data: { companyCount: number; emailCount: number; hostCount: number; host: string | null } }>(
      `/patterns?${qs.toString()}`
    );
  },
  whois: (domain: string) => request<{ success: true; data: { domain: string; createdAt: string | null; ageDays: number | null; source: string } }>(`/whois?domain=${encodeURIComponent(domain)}`),
  ocr: (imageBase64: string) => request<{ success: true; data: { text: string; confidence: number | null; cached?: boolean } }>(`/ocr`, { method: 'POST', body: JSON.stringify({ imageBase64 }) }),

  // back-compat aliases (so old code keeps working)
  list(): Promise<Job[]> { return this.listJobs(); },
  create(input: JobInput): Promise<Job> { return this.createJob(input); },
  update(id: string, patch: Partial<JobInput>): Promise<Job> { return this.updateJob(id, patch); },
  remove(id: string): Promise<{ ok: true }> { return this.deleteJob(id); },
};

export default api;

