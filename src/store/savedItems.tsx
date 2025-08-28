// src/store/savedItems.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SavedAnalysis = {
  id: string;
  title: string;
  source: "text" | "image";
  inputPreview?: string | null;
  imageUri?: string | null;
  score: number;
  verdict: "Low" | "Medium" | "High";
  flags: string[];
  createdAt: number;
};

type SavedItemsContextType = {
  items: SavedAnalysis[];
  hydrated: boolean;
  add: (item: SavedAnalysis) => void;
  remove: (id: string) => void;
  clearAll: () => void;
  update: (id: string, partial: Partial<SavedAnalysis>) => void;

  // NEW: backup/restore
  exportJSON: () => string;
  importJSON: (
    raw: string,
    mode?: "merge" | "replace"
  ) => { added: number; replaced: number; skipped: number };
};

const CTX = createContext<SavedItemsContextType | undefined>(undefined);
const STORAGE_KEY = "@job-scam-detector/saved-items";

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, hydrated]);

  const add = (item: SavedAnalysis) => setItems(prev => [item, ...prev]);
  const remove = (id: string) => setItems(prev => prev.filter(x => x.id !== id));
  const clearAll = () => setItems([]);
  const update = (id: string, partial: Partial<SavedAnalysis>) =>
    setItems(prev => prev.map(x => (x.id === id ? { ...x, ...partial } : x)));

  // -------- BACKUP / RESTORE --------
  const exportJSON = () => {
    const payload = {
      schema: "job-scam-detector/v1",
      exportedAt: Date.now(),
      count: items.length,
      items,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importJSON: SavedItemsContextType["importJSON"] = (raw, mode = "merge") => {
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Invalid JSON file.");
    }

    const incoming: SavedAnalysis[] = Array.isArray(parsed?.items)
      ? parsed.items
      : Array.isArray(parsed)
      ? parsed
      : [];

    // quick validation of objects
    const valid = incoming.filter(
      (x) =>
        x &&
        typeof x.id === "string" &&
        typeof x.title === "string" &&
        (x.source === "text" || x.source === "image") &&
        typeof x.score === "number" &&
        (x.verdict === "Low" || x.verdict === "Medium" || x.verdict === "High") &&
        Array.isArray(x.flags) &&
        typeof x.createdAt === "number"
    );

    if (mode === "replace") {
      setItems(valid);
      return { added: valid.length, replaced: items.length, skipped: incoming.length - valid.length };
    }

    // merge mode (default): keep existing; add new that don’t duplicate ids
    const map = new Map<string, SavedAnalysis>();
    for (const i of items) map.set(i.id, i);

    let added = 0;
    for (const i of valid) {
      if (!map.has(i.id)) {
        map.set(i.id, i);
        added++;
      }
    }
    setItems(Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt));
    return { added, replaced: 0, skipped: incoming.length - valid.length + (valid.length - added) };
  };

  const value = useMemo(
    () => ({ items, hydrated, add, remove, clearAll, update, exportJSON, importJSON }),
    [items, hydrated]
  );

  return <CTX.Provider value={value}>{children}</CTX.Provider>;
}

export function useSavedItems() {
  const ctx = useContext(CTX);
  if (!ctx) throw new Error("useSavedItems must be used within SavedItemsProvider");
  return ctx;
}