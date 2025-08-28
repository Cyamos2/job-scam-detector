import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Settings = {
  theme: "light" | "dark";
  sensitivity: number;   // 0–100
  autoSave: boolean;
};

const DEFAULTS: Settings = { theme: "light", sensitivity: 50, autoSave: false };
const STORAGE_KEY = "@jsd/settings";

type Ctx = {
  theme: Settings["theme"];
  sensitivity: number;
  autoSave: boolean;
  loading: boolean;
  setTheme: (t: Settings["theme"]) => void;
  setSensitivity: (n: number) => void;
  setAutoSave: (b: boolean) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<Ctx | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  // hydrate once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setState({ ...DEFAULTS, ...parsed });
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  // persist whenever state changes (after hydrate)
  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loading]);

  const setTheme = (t: Settings["theme"]) => setState(s => ({ ...s, theme: t }));
  const setSensitivity = (n: number) =>
    setState(s => ({ ...s, sensitivity: Math.max(0, Math.min(100, Math.round(n))) }));
  const setAutoSave = (b: boolean) => setState(s => ({ ...s, autoSave: b }));
  const resetSettings = () => setState(DEFAULTS);

  const value = useMemo(
    () => ({ ...state, loading, setTheme, setSensitivity, setAutoSave, resetSettings }),
    [state, loading]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}