// src/SettingsProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeName = 'system' | 'light' | 'dark';
export type RiskFilter = 'all' | 'high' | 'medium' | 'low';

type Settings = { theme: ThemeName; riskFilter: RiskFilter };

type Ctx = {
  hydrated: boolean;
  settings: Settings;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
  setRiskFilter: (r: RiskFilter) => void;
};

const STORAGE_KEY = '@jsd/settings:v1';
const DEFAULTS: Settings = { theme: 'system', riskFilter: 'all' };

const SettingsContext = createContext<Ctx | undefined>(undefined);

export const SettingsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  // Timer for debounced saves
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate once from storage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Settings>;
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.warn('Settings hydrate failed:', e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist with debounce; cleanup returns void
  useEffect(() => {
    if (!hydrated) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch((e) =>
        console.warn('Settings save failed:', e)
      );
    }, 250);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [settings, hydrated]);

  const setTheme = (t: ThemeName) => setSettings((s) => ({ ...s, theme: t }));

  const toggleTheme = () =>
    setSettings((s) => {
      const seq: ThemeName[] = ['system', 'light', 'dark'];
      return { ...s, theme: seq[(seq.indexOf(s.theme) + 1) % seq.length] };
    });

  const setRiskFilter = (r: RiskFilter) => setSettings((s) => ({ ...s, riskFilter: r }));

  const value = useMemo<Ctx>(
    () => ({ hydrated, settings, setTheme, toggleTheme, setRiskFilter }),
    [hydrated, settings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

export function resolveThemeName(theme: ThemeName): 'light' | 'dark' {
  if (theme === 'system') {
    const sys = Appearance.getColorScheme();
    return sys === 'dark' ? 'dark' : 'light';
  }
  return theme;
}