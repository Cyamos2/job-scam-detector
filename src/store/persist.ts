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
    const parsed = JSON.parse(raw) as PersistShapeV2 | any;

    // --- Migrations (extend as you bump versions)
    if (parsed.version === 2) {
      return parsed as PersistShapeV2;
    }

    // Unknown / older → best-effort normalize
    return {
      version: 2,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
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