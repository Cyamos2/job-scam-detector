import { useMemo } from "react";
import { useSettings } from "../SettingsProvider";

type NavTheme = {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    border: string;
    text: string;
    notification: string;
  };
};

const light: NavTheme = {
  dark: false,
  colors: {
    primary: "#2563eb",
    background: "#ffffff",
    card: "#f5f6fb",
    border: "#e5e7eb",
    text: "#111827",
    notification: "#2563eb",
  },
};

const dark: NavTheme = {
  dark: true,
  colors: {
    primary: "#3b82f6",
    background: "#0b0b0f",
    card: "#121218",
    border: "#2a2a33",
    text: "#f3f4f6",
    notification: "#3b82f6",
  },
};

export function useColors() {
  const { theme } = useSettings();
  const t = theme === "dark" ? dark : light;

  const mutedColor = theme === "dark" ? "#9aa0a6" : "#6b7280";

  const helpers = useMemo(
    () => ({
      bg: { backgroundColor: t.colors.background },
      card: { backgroundColor: t.colors.card, borderColor: t.colors.border },
      text: { color: t.colors.text },
      muted: { color: mutedColor },
    }),
    [t, mutedColor]
  );

  return { theme, ...t, colors: t.colors, ...helpers };
}