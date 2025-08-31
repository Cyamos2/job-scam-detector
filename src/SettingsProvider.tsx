import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeName = "light" | "dark";
export type VerdictFilter = "All" | "Low" | "Medium" | "High";
export type SortOrder = "Newest" | "Oldest";

type DbPrefs = {
  search: string;
  filter: VerdictFilter;
  sort: SortOrder;
};

type Settings = {
  theme: ThemeName;
  autoSave: boolean;
  sensitivity: number; // 0–100
  dbPrefs: DbPrefs;
};

type Ctx = {
  settings: Settings;
  hydrated: boolean;
  // handy top-level fields for convenience
  theme: ThemeName;
  autoSave: boolean;
  sensitivity: number;

  setTheme: (t: ThemeName) => void;
  setAutoSave: (v: boolean) => void;
  setSensitivity: (n: number) => void;

  setDbPrefs: (patch: Partial<DbPrefs>) => void;
  reset: () => void;
};

const DEFAULTS: Settings = {
  theme: "light",
  autoSave: false,
  sensitivity: 50,
  dbPrefs: { search: "", filter: "All", sort: "Newest" },
};

const KEY = "app:settings:v1";
const CTX = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  // hydrate once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Settings>;
          setSettings({ ...DEFAULTS, ...parsed });
        }
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // persist on change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, hydrated]);

  const api = useMemo<Ctx>(() => {
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    return {
      settings,
      hydrated,
      theme: settings.theme,
      autoSave: settings.autoSave,
      sensitivity: settings.sensitivity,

      setTheme: (t) => setSettings((s) => (s.theme === t ? s : { ...s, theme: t })),
      setAutoSave: (v) => setSettings((s) => ({ ...s, autoSave: v })),
      setSensitivity: (n) => setSettings((s) => ({ ...s, sensitivity: clamp(n) })),

      setDbPrefs: (patch) =>
        setSettings((s) => ({ ...s, dbPrefs: { ...s.dbPrefs, ...patch } })),

      reset: () => setSettings(DEFAULTS),
    };
  }, [settings, hydrated]);

  return <CTX.Provider value={api}>{children}</CTX.Provider>;
}

export function useSettings() {
  const ctx = useContext(CTX);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}