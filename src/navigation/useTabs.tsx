// src/navigation/useTabs.tsx
import * as React from "react";
import { useTheme } from "@react-navigation/native";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

export function useTabsOptions(): BottomTabNavigationOptions {
  const { colors } = useTheme();
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.text,
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopColor: colors.border,
    },
    tabBarLabelStyle: { fontWeight: "700" },
  };
}