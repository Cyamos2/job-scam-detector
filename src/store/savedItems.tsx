import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SavedAnalysis = {
  id: string;
  title: string;
  source: "text" | "image";
  inputPreview?: string | null;
  imageUri?: string | null;
  score: number; // 0–100
  verdict: "Low" | "Medium" | "High";
  flags: string[];
  createdAt: number; // epoch ms
};

type SavedItemsContextType = {
  items: SavedAnalysis[];
  hydrated: boolean;

  add: (item: SavedAnalysis) => void;
  addMany: (items: SavedAnalysis[]) => void; // ← needed for Import
  update: (id: string, partial: Partial<SavedAnalysis>) => void;

  remove: (id: string) => void;
  clearAll: () => void;
};

const STORAGE_KEY = "@job-scam-detector/saved-items:v1";
const CTX = createContext<SavedItemsContextType | undefined>(undefined);

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            // light validation
            const safe = parsed.filter(
              (x) => x && typeof x.id === "string" && typeof x.createdAt === "number"
            ) as SavedAnalysis[];
            setItems(safe);
          }
        }
      } catch {}
      setHydrated(true);
    })();
  }, []);

  // Persist when hydrated
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, hydrated]);

  const add = (item: SavedAnalysis) => {
    setItems((prev) => [item, ...prev]);
  };

  const addMany = (incoming: SavedAnalysis[]) => {
    setItems((prev) => {
      const map = new Map<string, SavedAnalysis>(prev.map((i) => [i.id, i]));
      for (const x of incoming) {
        if (!x || typeof x.id !== "string") continue;
        if (!map.has(x.id)) map.set(x.id, x);
      }
      // newest first
      return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
    });
  };

  const update = (id: string, partial: Partial<SavedAnalysis>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...partial } : x)));
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const clearAll = () => setItems([]);

  const value = useMemo<SavedItemsContextType>(
    () => ({ items, hydrated, add, addMany, update, remove, clearAll }),
    [items, hydrated]
  );

  return <CTX.Provider value={value}>{children}</CTX.Provider>;
}

export function useSavedItems() {
  const ctx = useContext(CTX);
  if (!ctx) throw new Error("useSavedItems must be used within SavedItemsProvider");
  return ctx;
}