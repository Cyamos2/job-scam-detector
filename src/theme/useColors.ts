import { useTheme } from "@react-navigation/native";

/** Small helper so all screens style correctly in light/dark. */
export function useColors() {
  const theme = useTheme();
  const { colors, dark } = theme;

  const bg = { backgroundColor: colors.background };
  const card = { backgroundColor: colors.card, borderColor: colors.border };
  const text = { color: colors.text };
  const muted = { color: dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" };

  return { theme, colors, bg, card, text, muted };
}