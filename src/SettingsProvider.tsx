import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Theme = "light" | "dark";

type SettingsCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;

  autoSave: boolean;
  setAutoSave: (b: boolean) => void;

  sensitivity: number; // 0–100
  setSensitivity: (n: number) => void;

  reset: () => void; // ← required by SettingsScreen
};

const DEFAULTS: Readonly<Pick<SettingsCtx, "theme" | "autoSave" | "sensitivity">> = {
  theme: "light",
  autoSave: false,
  sensitivity: 50,
};

const STORAGE_KEY = "@job-scam-detector/settings:v1";

const Ctx = createContext<SettingsCtx | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULTS.theme);
  const [autoSave, setAutoSave] = useState<boolean>(DEFAULTS.autoSave);
  const [sensitivity, setSensitivity] = useState<number>(DEFAULTS.sensitivity);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.theme === "light" || parsed.theme === "dark") setTheme(parsed.theme);
          if (typeof parsed.autoSave === "boolean") setAutoSave(parsed.autoSave);
          if (typeof parsed.sensitivity === "number")
            setSensitivity(Math.max(0, Math.min(100, parsed.sensitivity)));
        }
      } catch {}
      setHydrated(true);
    })();
  }, []);

  // Persist after hydration
  useEffect(() => {
    if (!hydrated) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ theme, autoSave, sensitivity })
        );
      } catch {}
    };
    save();
  }, [theme, autoSave, sensitivity, hydrated]);

  const reset = () => {
    setTheme(DEFAULTS.theme);
    setAutoSave(DEFAULTS.autoSave);
    setSensitivity(DEFAULTS.sensitivity);
  };

  const value = useMemo<SettingsCtx>(
    () => ({ theme, setTheme, autoSave, setAutoSave, sensitivity, setSensitivity, reset }),
    [theme, autoSave, sensitivity]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}