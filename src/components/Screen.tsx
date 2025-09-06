// src/components/Screen.tsx
import * as React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  insetBottom?: boolean; // allow optional bottom inset
  padded?: boolean;      // allow optional padding (default true)
};

export default function Screen({
  children,
  insetBottom = false,
  padded = true,
}: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={insetBottom ? ["top", "left", "right", "bottom"] : ["top", "left", "right"]}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
          !padded && { padding: 0 },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 16 },
});