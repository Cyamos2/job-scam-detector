// src/navigation/RootNavigator.tsx
import * as React from "react";
import { useTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import DatabaseScreen from "../screens/DatabaseScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ReportDetailScreen from "../screens/ReportDetailScreen";
import AddContentScreen from "../screens/AddContentScreen";

import type { RootStackParamList, TabsParamList } from "./types";

// If your types file doesn't have TabsParamList, it should be:
// export type TabsParamList = { Home: undefined; Database: undefined; Settings: undefined; }

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

function TabsNav() {
  const { colors } = useTheme();

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarIcon: ({ color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = "home-outline";
          if (route.name === "Database") icon = "list-outline";
          if (route.name === "Settings") icon = "settings-outline";
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Database" component={DatabaseScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Tabs" screenOptions={{ headerShown: true }}>
      {/* Tabs shell (no header inside tabs) */}
      <Stack.Screen name="Tabs" component={TabsNav} options={{ headerShown: false }} />

      {/* Pushed detail screen */}
      <Stack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ title: "Report" }}
      />

      {/* Modal composer for adding content */}
      <Stack.Screen
        name="AddContent"
        component={AddContentScreen}
        options={{ presentation: "modal", title: "Add Content" }}
      />
    </Stack.Navigator>
  );
}