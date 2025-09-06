// src/hooks/usePersistedState.ts
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Persist a piece of state in AsyncStorage.
 * Loads once on mount, then saves on every change.
 */
export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);

  // Load once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (alive && raw != null) {
          setValue(JSON.parse(raw) as T);
        }
      } catch {
        /* ignore */
      } finally {
        loaded.current = true;
      }
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  // Save after first load
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
  }, [key, value]);

  return [value, setValue] as const;
}