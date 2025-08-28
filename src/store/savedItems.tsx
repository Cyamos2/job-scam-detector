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

  const value = useMemo(
    () => ({ items, hydrated, add, remove, clearAll, update }),
    [items, hydrated]
  );

  return <CTX.Provider value={value}>{children}</CTX.Provider>;
}

export function useSavedItems() {
  const ctx = useContext(CTX);
  if (!ctx) throw new Error("useSavedItems must be used within SavedItemsProvider");
  return ctx;
}