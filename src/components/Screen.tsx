// src/components/Screen.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";

type Props = {
  children: React.ReactNode;
  insetBottom?: boolean; // <- add back
};

export default function Screen({ children, insetBottom = false }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={insetBottom ? ["top", "left", "right", "bottom"] : ["top", "left", "right"]}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 16 },
});