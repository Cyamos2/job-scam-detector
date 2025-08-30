// src/theme/useColors.ts
import { useTheme } from "@react-navigation/native";

/**
 * Central color tokens + ready-to-use style shorthands.
 * Every screen should pull colors/text/bg/card from here.
 */
export function useColors() {
  const navTheme = useTheme(); // { dark, colors: { primary, background, card, text, border, notification } }

  // You can tune these two palettes freely
  const palette = navTheme.dark
    ? {
        primary: navTheme.colors.primary, // keep whatever you set in NavigationContainer
        background: "#000000",
        card: "#121212",
        text: "#FFFFFF",
        border: "#2A2A2A",
        notification: "#FF453A",
        muted: "#9AA0A6",
      }
    : {
        primary: navTheme.colors.primary,
        background: "#FFFFFF",
        card: "#F2F2F7",
        text: "#111111",
        border: "#E0E0E6",
        notification: "#FF453A",
        muted: "#6B7280",
      };

  const colors = {
    primary: palette.primary,
    background: palette.background,
    card: palette.card,
    text: palette.text,
    border: palette.border,
    notification: palette.notification,
    muted: palette.muted, // <- handy for placeholders/secondary text
  };

  // ready-to-use style shorthands
  const bg = { backgroundColor: colors.background };
  const card = { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 };
  const text = { color: colors.text };
  const muted = { color: colors.muted };

  return { theme: navTheme, colors, bg, card, text, muted };
}