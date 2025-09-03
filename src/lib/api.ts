// src/lib/api.ts
import Constants from 'expo-constants';

export type Risk = 'low' | 'medium' | 'high';
export type Job = {
  id: string;
  title: string;
  company: string;
  url?: string;
  risk: Risk;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

export type JobInput = {
  title: string;
  company: string;
  url?: string;
  risk?: Risk;
  notes?: string;
};

const BASE_URL =
  (Constants?.expoConfig?.extra as any)?.API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listJobs(): Promise<Job[]> {
    return request<Job[]>('/jobs');
  },
  // Back-compat alias (old code calls api.list())
  list(): Promise<Job[]> {
    return this.listJobs();
  },
  createJob(input: JobInput): Promise<Job> {
    return request<Job>('/jobs', { method: 'POST', body: JSON.stringify(input) });
  },
  updateJob(id: string, patch: Partial<JobInput>): Promise<Job> {
    return request<Job>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },
  deleteJob(id: string): Promise<{ ok: true }> {
    return request<{ ok: true }>(`/jobs/${id}`, { method: 'DELETE' });
  },
  verifyCompany(target: string) {
    return request(`/verify?target=${encodeURIComponent(target)}`);
  },
};

export default api;