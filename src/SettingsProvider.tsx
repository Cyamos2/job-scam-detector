import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

type AppSettings = {
  theme: ThemeMode;
  sensitivity: number; // 0..100
  autoSave: boolean;   // NEW
};

type SettingsContextValue = AppSettings & {
  isHydrated: boolean;
  setTheme: (t: ThemeMode) => void;
  setSensitivity: (n: number) => void;
  setAutoSave: (b: boolean) => void; // NEW
  resetSettings: () => void;
};

const STORAGE_KEY = "app.settings.v1";
const DEFAULTS: AppSettings = { theme: "system", sensitivity: 50, autoSave: false };

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppSettings>(DEFAULTS);
  const [isHydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState((s) => ({ ...s, ...(JSON.parse(raw) as Partial<AppSettings>) }));
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, isHydrated]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      isHydrated,
      setTheme: (t) => setState((s) => ({ ...s, theme: t })),
      setSensitivity: (n) =>
        setState((s) => ({ ...s, sensitivity: Math.max(0, Math.min(100, Math.round(n))) })),
      setAutoSave: (b) => setState((s) => ({ ...s, autoSave: !!b })),
      resetSettings: () => setState(DEFAULTS),
    }),
    [state, isHydrated]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
};