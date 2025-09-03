import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

const C = createContext<Ctx | undefined>(undefined);

export const SettingsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setSettings((s) => ({ ...s, ...JSON.parse(raw) }));
      } catch (e) {
        console.warn('Settings hydrate failed:', e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch((e) =>
        console.warn('Settings save failed:', e)
      );
    }, 250);
    return () => timer.current && clearTimeout(timer.current);
  }, [hydrated, settings]);

  const setTheme = (t: ThemeName) => setSettings((s) => ({ ...s, theme: t }));
  const toggleTheme = () =>
    setSettings((s) => {
      const seq: ThemeName[] = ['system', 'light', 'dark'];
      return { ...s, theme: seq[(seq.indexOf(s.theme) + 1) % seq.length] };
    });
  const setRiskFilter = (r: RiskFilter) => setSettings((s) => ({ ...s, riskFilter: r }));

  const value = useMemo<Ctx>(() => ({ hydrated, settings, setTheme, toggleTheme, setRiskFilter }), [hydrated, settings]);
  return <C.Provider value={value}>{children}</C.Provider>;
};

export function useSettings() {
  const ctx = useContext(C);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

export function resolveThemeName(theme: ThemeName): 'light' | 'dark' {
  if (theme === 'system') return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  return theme;
}