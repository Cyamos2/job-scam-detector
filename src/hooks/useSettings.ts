// src/hooks/useSettings.ts
import { useCallback, useEffect, useState } from 'react';
import type { Settings } from '../lib/settings';
import { defaultSettings, loadSettings, saveSettings } from '../lib/settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load once
  useEffect(() => {
    let isMounted = true;
    loadSettings().then((s) => {
      if (isMounted) {
        setSettings(s);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Merge + persist
  const update = useCallback(async (partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      // persist in background; no need to await here
      saveSettings(next).catch(() => {});
      return next;
    });
  }, []);

  return { settings, update, loading };
}