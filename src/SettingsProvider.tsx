import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark";
type VerdictFilter = "All" | "Low" | "Medium" | "High";
type SortOrder = "Newest" | "Oldest";

export type Settings = {
  theme: Theme;
  autoSave: boolean;
  sensitivity: number;

  // NEW: database UI prefs
  dbSearch: string;
  dbFilter: VerdictFilter;
  dbSort: SortOrder;
};

const STORAGE_KEY = "@job-scam-detector/settings.v2";

export const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  autoSave: true,
  sensitivity: 50,

  dbSearch: "",
  dbFilter: "All",
  dbSort: "Newest",
};

type Ctx = {
  // full settings object (handy if you want to read several at once)
  settings: Settings;

  // existing props kept for backwards compatibility
  theme: Theme;
  setTheme: (t: Theme) => void;
  autoSave: boolean;
  setAutoSave: (v: boolean) => void;
  sensitivity: number;
  setSensitivity: (n: number) => void;

  // NEW setters
  dbSearch: string;
  setDbSearch: (s: string) => void;
  dbFilter: VerdictFilter;
  setDbFilter: (f: VerdictFilter) => void;
  dbSort: SortOrder;
  setDbSort: (s: SortOrder) => void;

  // bulk update + reset
  update: (partial: Partial<Settings>) => void;
  reset: () => void;

  loading: boolean;
};

const SettingsContext = createContext<Ctx | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Settings>;
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, loading]);

  const update = (partial: Partial<Settings>) =>
    setSettings((prev) => ({ ...prev, ...partial }));

  const value: Ctx = useMemo(
    () => ({
      settings,
      theme: settings.theme,
      setTheme: (t) => update({ theme: t }),
      autoSave: settings.autoSave,
      setAutoSave: (v) => update({ autoSave: v }),
      sensitivity: settings.sensitivity,
      setSensitivity: (n) => update({ sensitivity: n }),

      dbSearch: settings.dbSearch,
      setDbSearch: (s) => update({ dbSearch: s }),
      dbFilter: settings.dbFilter,
      setDbFilter: (f) => update({ dbFilter: f }),
      dbSort: settings.dbSort,
      setDbSort: (s) => update({ dbSort: s }),

      update,
      reset: () => setSettings(DEFAULT_SETTINGS),
      loading,
    }),
    [settings, loading]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}