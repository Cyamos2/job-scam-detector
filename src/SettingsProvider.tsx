// src/SettingsProvider.tsx
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

export type ThemeName = "light" | "dark";

type Ctx = {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  autoSave: boolean;
  setAutoSave: (v: boolean) => void;
  sensitivity: number; // 0..100
  setSensitivity: (n: number) => void;
  reset: () => void;
};

const SettingsCtx = createContext<Ctx | undefined>(undefined);

const DEFAULTS = {
  theme: "light" as ThemeName,
  autoSave: false,
  sensitivity: 50,
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>(DEFAULTS.theme);
  const [autoSave, setAutoSave] = useState<boolean>(DEFAULTS.autoSave);
  const [sensitivity, setSensitivity] = useState<number>(DEFAULTS.sensitivity);

  const reset = useCallback(() => {
    setTheme(DEFAULTS.theme);
    setAutoSave(DEFAULTS.autoSave);
    setSensitivity(DEFAULTS.sensitivity);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ theme, setTheme, autoSave, setAutoSave, sensitivity, setSensitivity, reset }),
    [theme, autoSave, sensitivity, reset]
  );

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
};

export function useSettings(): Ctx {
  const v = useContext(SettingsCtx);
  if (!v) throw new Error("useSettings must be used within SettingsProvider");
  return v;
}