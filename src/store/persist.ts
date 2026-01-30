// src/store/persist.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Job = {
  id: string;
  title: string;
  company: string;
  url?: string;
  notes?: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
};

export type PersistShapeV2 = {
  version: 2;
  items: Job[];
  deleted: Job[]; // for undo / recycle bin (optional UI)
};

const KEY = "jobs:v2";

export const emptyState = (): PersistShapeV2 => ({
  version: 2,
  items: [],
  deleted: [],
});

export async function loadFromDisk(): Promise<PersistShapeV2> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed: unknown = JSON.parse(raw);

    // --- Migrations (extend as you bump versions)
    function isPersistV2(x: unknown): x is PersistShapeV2 {
      if (typeof x !== "object" || x === null) return false;
      const o = x as Record<string, unknown>;
      return o.version === 2 && Array.isArray(o.items) && Array.isArray(o.deleted);
    }

    if (isPersistV2(parsed)) {
      return parsed;
    }

    // Unknown / older → best-effort normalize
    const maybeItems = (parsed && typeof parsed === "object" && "items" in parsed && Array.isArray((parsed as Record<string, unknown>).items)) ? (parsed as Record<string, unknown>).items as unknown[] : [];
    const maybeDeleted = (parsed && typeof parsed === "object" && "deleted" in parsed && Array.isArray((parsed as Record<string, unknown>).deleted)) ? (parsed as Record<string, unknown>).deleted as unknown[] : [];

    return {
      version: 2,
      items: maybeItems as Job[],
      deleted: maybeDeleted as Job[],
    }; 
  } catch {
    return emptyState();
  }
}

export async function saveToDisk(state: PersistShapeV2): Promise<void> {
  const safe: PersistShapeV2 = {
    version: 2,
    items: state.items,
    deleted: state.deleted,
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(safe));
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}