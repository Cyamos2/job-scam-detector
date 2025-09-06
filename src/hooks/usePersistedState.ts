// src/hooks/usePersistedState.ts
import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Persist any serializable state to AsyncStorage.
 * - Debounced writes (150ms) to avoid chatty storage.
 * - Loads once on mount; falls back to `initialValue` if nothing stored.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): readonly [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = React.useState<T>(initialValue);
  const didHydrate = React.useRef(false);

  // Hydrate once
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (!alive) return;
        if (raw != null) {
          setValue(JSON.parse(raw) as T);
        }
      } catch {
        // ignore parse/storage errors
      } finally {
        didHydrate.current = true;
      }
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  // Persist with tiny debounce
  React.useEffect(() => {
    if (!didHydrate.current) return;
    const id = setTimeout(() => {
      AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
    }, 150);
    return () => clearTimeout(id);
  }, [key, value]);

  return [value, setValue] as const;
}
export default usePersistedState;