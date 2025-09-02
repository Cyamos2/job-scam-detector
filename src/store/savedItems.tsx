import * as React from "react";

export type SavedAnalysis = {
  id: string;
  title: string;
  source: string; // "text" | "image" | etc.
  inputPreview?: string;
  imageUri?: string | null;
  score: number;
  verdict: "LOW" | "MEDIUM" | "HIGH" | string;
  flags: string[];
  createdAt: number; // ms since epoch
};

type Ctx = {
  items: SavedAnalysis[];
  add: (item: SavedAnalysis) => void;
  update: (id: string, patch: Partial<SavedAnalysis>) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CTX = React.createContext<Ctx | null>(null);

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<SavedAnalysis[]>([]);

  const add = React.useCallback((item: SavedAnalysis) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  const update = React.useCallback((id: string, patch: Partial<SavedAnalysis>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const remove = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clear = React.useCallback(() => setItems([]), []);

  const value = React.useMemo<Ctx>(() => ({ items, add, update, remove, clear }), [items, add, update, remove, clear]);

  return <CTX.Provider value={value}>{children}</CTX.Provider>;
}

/** Hook to access saved items (throws if provider missing) */
export function useSavedItems(): Ctx {
  const ctx = React.useContext(CTX);
  if (!ctx) throw new Error("useSavedItems must be used within SavedItemsProvider");
  return ctx;
}