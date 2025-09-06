// src/components/Screen.tsx
import * as React from "react";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  /** include bottom inset when you need space above the home indicator */
  insetBottom?: boolean;
};

export default function Screen({ children, insetBottom = false }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={insetBottom ? ["top", "left", "right", "bottom"] : ["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {children}
    </SafeAreaView>
  );
}