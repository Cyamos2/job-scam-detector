import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback } from "react";

export type SavedAnalysis = {
  id: string;               // unique id
  title: string;            // short label
  source?: "text" | "image";
  inputPreview?: string;    // first 120 chars of text / file name
  imageUri?: string | null; // if saved from screenshot
  score: number;            // 0..100
  verdict: "Low" | "Medium" | "High";
  flags: string[];
  createdAt: number;        // Date.now()
};

const STORAGE_KEY = "app.savedItems.v1";

export function useSavedItems() {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // hydrate once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // persist after hydration
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, hydrated]);

  const add = useCallback((entry: SavedAnalysis) => {
    setItems(prev => [entry, ...prev]);
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(x => x.id !== id));
  }, []);

  const clearAll = useCallback(() => setItems([]), []);

  return { items, hydrated, add, remove, clearAll };
}