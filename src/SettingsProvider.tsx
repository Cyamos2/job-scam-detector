// src/SettingsProvider.tsx
import React from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeName = "system" | "light" | "dark";
export type RiskFilter = "all" | "low" | "medium" | "high";

export type Settings = {
  theme: ThemeName;
  defaultRiskFilter: RiskFilter;
};

type Ctx = {
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
};

const DEFAULTS: Settings = { theme: "system", defaultRiskFilter: "all" };
const KEY = "@scamicide/settings/v1";

const Ctx = React.createContext<Ctx | undefined>(undefined);

export function resolveThemeName(theme: ThemeName): "light" | "dark" {
  if (theme === "system") {
    return Appearance.getColorScheme() === "dark" ? "dark" : "light";
  }
  return theme;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = React.useState<Settings>(DEFAULTS);

  // load once
  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setSettingsState({ ...DEFAULTS, ...JSON.parse(raw) });
      } catch {}
    })();
  }, []);

  // save on change
  React.useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(KEY, JSON.stringify(settings));
      } catch {}
    })();
  }, [settings]);

  const setSettings = React.useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = React.useMemo(() => ({ settings, setSettings }), [settings, setSettings]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): Ctx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export default SettingsProvider;