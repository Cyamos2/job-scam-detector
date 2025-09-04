// src/lib/api.ts
import Constants from "expo-constants";
import { Platform } from "react-native";

/** Try to build http://<your-lan-ip>:3000 from Expo runtime info */
function pickLanFromExpo(): string | null {
  // explicit extra always wins if present
  const extra = (Constants?.expoConfig?.extra ?? {}) as any;
  if (extra.API_URL) return String(extra.API_URL);

  // hostUri is often like "192.168.1.25:19000" in Expo Go
  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.hostUri;

  if (typeof hostUri === "string") {
    const m = hostUri.match(/(\d{1,3}\.){3}\d{1,3}/); // pull an IPv4
    if (m?.[0]) return `http://${m[0]}:3000`;
  }
  return null;
}

/** Final decision for the API base URL */
function resolveBaseUrl(): string {
  // 1) explicit env (works with EAS/Expo as EXPO_PUBLIC_*)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // 2) infer LAN IP from Expo hostUri (works on real device with Expo Go)
  const inferred = pickLanFromExpo();
  if (inferred) return inferred;

  // 3) simulator defaults
  if (Platform.OS === "ios") return "http://127.0.0.1:3000";     // iOS simulator
  if (Platform.OS === "android") return "http://10.0.2.2:3000";  // Android emulator

  // 4) web/unknown fallback
  return "http://localhost:3000";
}

export const BASE_URL = resolveBaseUrl();

export type Risk = "low" | "medium" | "high";

export type Job = {
  id: string;
  title: string;
  company: string;
  url?: string | null;
  risk: Risk;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type JobInput = {
  title: string;
  company: string;
  url?: string;
  risk?: Risk;
  notes?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    throw new Error(
      `API ${res.status} ${res.statusText}: ${await res.text().catch(() => "")}`
    );
  }
  return res.json() as Promise<T>;
}

export const api = {
  listJobs: (): Promise<Job[]> => request<Job[]>("/jobs"),
  createJob: (input: JobInput): Promise<Job> =>
    request<Job>("/jobs", { method: "POST", body: JSON.stringify(input) }),
  updateJob: (id: string, patch: Partial<JobInput>): Promise<Job> =>
    request<Job>(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteJob: (id: string): Promise<{ ok: true }> =>
    request<{ ok: true }>(`/jobs/${id}`, { method: "DELETE" }),
  verifyCompany: (target: string) =>
    request(`/verify?target=${encodeURIComponent(target)}`),

  // back-compat aliases
  list(): Promise<Job[]> { return this.listJobs(); },
  create(input: JobInput): Promise<Job> { return this.createJob(input); },
  update(id: string, patch: Partial<JobInput>): Promise<Job> { return this.updateJob(id, patch); },
  remove(id: string): Promise<{ ok: true }> { return this.deleteJob(id); },
};

export default api;