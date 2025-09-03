// src/theme/useColors.ts
import { useTheme } from "@react-navigation/native";

export function useColors() {
  const { colors, dark } = useTheme();
  // expose anything you need, or just return colors
  return {
    ...colors,
    isDark: dark,
    // optional derived colors:
    mutedText: dark ? "#cbd5e1" : "#6b7280",
    subtleBg: dark ? "#0f1216" : "#f9fafb",
  };
}