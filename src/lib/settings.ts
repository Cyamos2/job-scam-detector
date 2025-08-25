// src/lib/settings.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ThemeMode = 'light' | 'dark';

export type Settings = {
  theme: ThemeMode;
  riskThreshold: RiskLevel;
  domainAgeBoost: boolean;
  // room to grow: analyticsOptIn, crashReports, etc.
};

const STORAGE_KEY = 'scamicide_settings_v1';

export const defaultSettings: Settings = {
  theme: 'dark',
  riskThreshold: 'Medium',
  domainAgeBoost: true,
};

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed } as Settings;
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(next: Settings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}