// src/components/Screen.tsx
import * as React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

/**
 * Screen
 * - Keeps content below the notch/status bar
 * - Provides consistent horizontal padding
 * - Light background to match the app
 */
export default function Screen({ children, style }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 6 },
});