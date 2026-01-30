// src/navigation/RootNavigator.tsx
import * as React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RootStackParamList, RootTabParamList } from "./types";

// Screens
import HomeScreen from "../screens/HomeScreen";
import DatabaseScreen from "../screens/DatabaseScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AddContentScreen from "../screens/AddContentScreen";
import ReportDetailScreen from "../screens/ReportDetailScreen";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmallPhone = width < 390;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarShowLabel: !isSmallPhone,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginBottom: 2,        // lift text a touch
          lineHeight: 13,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        // 👇 Safe-area aware so the iOS home indicator doesn't cover labels
        tabBarStyle: {
          height: 54 + insets.bottom,
          paddingTop: 4,
          paddingBottom: Math.max(6, insets.bottom - 2),
          borderTopColor: "#E5E7EB",
          borderTopWidth: StyleSheet.hairlineWidth,
          backgroundColor: "#FFF",
        },
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Database":
              iconName = focused ? "list" : "list-outline";
              break;
            case "Settings":
            default:
              iconName = focused ? "settings" : "settings-outline";
              break;
          }
          return (
            <Ionicons
              name={iconName}
              size={size ?? 22}
              color={color}
              style={{ marginTop: -1 }} // tiny nudge for perfect centering
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Database" component={DatabaseScreen} options={{ tabBarLabel: "Database" }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: "Settings" }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="AddContent" component={AddContentScreen} options={{ title: "Add Job" }} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: "Report" }} />
    </Stack.Navigator>
  );
}