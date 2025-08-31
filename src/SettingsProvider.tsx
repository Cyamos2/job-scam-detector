// SettingsProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeName = "light" | "dark";
type RiskFilter = "all" | "high" | "medium" | "low";
type SortMode = "newest" | "oldest" | "scoreHigh" | "scoreLow";

type Settings = {
  // existing
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;

  autoSave: boolean;
  setAutoSave: (v: boolean) => void;

  sensitivity: number;
  setSensitivity: (n: number) => void;

  reset: () => void;

  // NEW – DB view prefs
  dbSearch: string;
  setDbSearch: (s: string) => void;

  dbRisk: RiskFilter;
  setDbRisk: (r: RiskFilter) => void;

  dbSort: SortMode;
  setDbSort: (s: SortMode) => void;

  // hydration flag (optional, handy)
  hydrated: boolean;
};

const CTX = createContext<Settings | null>(null);

const KEYS = {
  theme: "settings.theme",
  autoSave: "settings.autoSave",
  sensitivity: "settings.sensitivity",
  dbSearch: "settings.db.search",
  dbRisk: "settings.db.risk",
  dbSort: "settings.db.sort",
} as const;

const DEFAULTS = {
  theme: "light" as ThemeName,
  autoSave: false,
  sensitivity: 50,
  dbSearch: "",
  dbRisk: "all" as RiskFilter,
  dbSort: "newest" as SortMode,
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  const [theme, setTheme] = useState<ThemeName>(DEFAULTS.theme);
  const [autoSave, setAutoSave] = useState<boolean>(DEFAULTS.autoSave);
  const [sensitivity, setSensitivity] = useState<number>(DEFAULTS.sensitivity);

  const [dbSearch, setDbSearch] = useState<string>(DEFAULTS.dbSearch);
  const [dbRisk, setDbRisk] = useState<RiskFilter>(DEFAULTS.dbRisk);
  const [dbSort, setDbSort] = useState<SortMode>(DEFAULTS.dbSort);

  // hydrate
  useEffect(() => {
    (async () => {
      try {
        const [
          sTheme,
          sAutoSave,
          sSens,
          sDbSearch,
          sDbRisk,
          sDbSort,
        ] = await Promise.all([
          AsyncStorage.getItem(KEYS.theme),
          AsyncStorage.getItem(KEYS.autoSave),
          AsyncStorage.getItem(KEYS.sensitivity),
          AsyncStorage.getItem(KEYS.dbSearch),
          AsyncStorage.getItem(KEYS.dbRisk),
          AsyncStorage.getItem(KEYS.dbSort),
        ]);

        if (sTheme === "light" || sTheme === "dark") setTheme(sTheme);
        if (sAutoSave != null) setAutoSave(sAutoSave === "1");
        if (sSens != null && !Number.isNaN(+sSens)) setSensitivity(Math.max(0, Math.min(100, +sSens)));

        if (typeof sDbSearch === "string") setDbSearch(sDbSearch);
        if (sDbRisk === "all" || sDbRisk === "high" || sDbRisk === "medium" || sDbRisk === "low") setDbRisk(sDbRisk);
        if (sDbSort === "newest" || sDbSort === "oldest" || sDbSort === "scoreHigh" || sDbSort === "scoreLow")
          setDbSort(sDbSort);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // persist
  useEffect(() => {
    AsyncStorage.setItem(KEYS.theme, theme).catch(() => {});
  }, [theme]);
  useEffect(() => {
    AsyncStorage.setItem(KEYS.autoSave, autoSave ? "1" : "0").catch(() => {});
  }, [autoSave]);
  useEffect(() => {
    AsyncStorage.setItem(KEYS.sensitivity, String(sensitivity)).catch(() => {});
  }, [sensitivity]);

  useEffect(() => {
    AsyncStorage.setItem(KEYS.dbSearch, dbSearch).catch(() => {});
  }, [dbSearch]);
  useEffect(() => {
    AsyncStorage.setItem(KEYS.dbRisk, dbRisk).catch(() => {});
  }, [dbRisk]);
  useEffect(() => {
    AsyncStorage.setItem(KEYS.dbSort, dbSort).catch(() => {});
  }, [dbSort]);

  const reset = () => {
    setTheme(DEFAULTS.theme);
    setAutoSave(DEFAULTS.autoSave);
    setSensitivity(DEFAULTS.sensitivity);
    setDbSearch(DEFAULTS.dbSearch);
    setDbRisk(DEFAULTS.dbRisk);
    setDbSort(DEFAULTS.dbSort);
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      autoSave,
      setAutoSave,
      sensitivity,
      setSensitivity,
      reset,
      dbSearch,
      setDbSearch,
      dbRisk,
      setDbRisk,
      dbSort,
      setDbSort,
      hydrated,
    }),
    [theme, autoSave, sensitivity, dbSearch, dbRisk, dbSort, hydrated]
  );

  return <CTX.Provider value={value}>{children}</CTX.Provider>;
}

export function useSettings() {
  const v = useContext(CTX);
  if (!v) throw new Error("useSettings must be used within SettingsProvider");
  return v;
}