// src/SettingsProvider.tsx
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
};

type SettingsContextValue = AppSettings & {
  isHydrated: boolean;
  setTheme: (t: ThemeMode) => void;
  setSensitivity: (n: number) => void;
  resetSettings: () => void;
};

const STORAGE_KEY = "app.settings.v1";

const DEFAULTS: AppSettings = {
  theme: "system",
  sensitivity: 50,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppSettings>(DEFAULTS);
  const [isHydrated, setHydrated] = useState(false);

  // Load on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppSettings>;
          setState((s) => ({ ...s, ...parsed }));
        }
      } catch (e) {
        console.warn("Settings load failed:", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist after hydration
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((e) =>
      console.warn("Settings save failed:", e)
    );
  }, [state, isHydrated]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      isHydrated,
      setTheme: (t) => setState((s) => ({ ...s, theme: t })),
      setSensitivity: (n) =>
        setState((s) => ({
          ...s,
          sensitivity: Math.max(0, Math.min(100, Math.round(n))),
        })),
      resetSettings: () => setState(DEFAULTS),
    }),
    [state, isHydrated]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
};