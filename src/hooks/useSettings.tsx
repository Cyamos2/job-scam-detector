import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { DEFAULT_SETTINGS, type Settings } from "../appSettings";

export type UseSettings = {
  settings: Settings;
  loading: boolean;
  update: (partial: Partial<Settings>) => Promise<void> | void;
  clearSaved: () => Promise<void> | void;
};

const SettingsContext = createContext<UseSettings | undefined>(undefined);

export function SettingsProvider({ children }: PropsWithChildren): JSX.Element {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading] = useState(false);

  const persist = useCallback(async (_next: Settings) => {
    // wire AsyncStorage later if desired
  }, []);

  const update = useCallback<UseSettings["update"]>(async partial => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      void persist(next);
      return next;
    });
  }, [persist]);

  const clearSaved = useCallback<UseSettings["clearSaved"]>(async () => {
    // plug your DB clearing here later
  }, []);

  const value = useMemo<UseSettings>(
    () => ({ settings, loading, update, clearSaved }),
    [settings, loading, update, clearSaved]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): UseSettings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}