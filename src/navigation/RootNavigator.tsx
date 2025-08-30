// src/navigation/RootNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";

// Screens
import HomeScreen from "../screens/HomeScreen";
import AddContentScreen from "../screens/AddContentScreen";
import DatabaseScreen from "../screens/DatabaseScreen";
import ReportDetailScreen from "../screens/ReportDetailScreen";
import SettingsScreen from "../screens/SettingsScreen";

/** ----- Param Lists (exported for screen typing) ----- */
export type HomeStackParamList = {
  HomeMain: undefined;
  AddContent: undefined;
  ReportDetail: { id: string };
};

export type DatabaseStackParamList = {
  DatabaseMain: undefined;
  ReportDetail: { id: string };
};

const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
const DatabaseStackNav = createNativeStackNavigator<DatabaseStackParamList>();
const Tabs = createBottomTabNavigator();

/** Shared, theme-aware header options */
function useThemedStackOptions(): NativeStackNavigationOptions {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.card },
    headerTitleStyle: { color: colors.text },
    headerTintColor: colors.text, // back arrow / icons
    headerShadowVisible: false,
    // headerBackVisible defaults to true; omit unless you want to hide
  };
}

/** Home stack */
function HomeStack() {
  const opts = useThemedStackOptions();
  return (
    <HomeStackNav.Navigator screenOptions={opts}>
      <HomeStackNav.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <HomeStackNav.Screen
        name="AddContent"
        component={AddContentScreen}
        options={{ title: "Add Content" }}
      />
      <HomeStackNav.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ title: "Report" }}
      />
    </HomeStackNav.Navigator>
  );
}

/** Database stack */
function DatabaseStack() {
  const opts = useThemedStackOptions();
  return (
    <DatabaseStackNav.Navigator screenOptions={opts}>
      <DatabaseStackNav.Screen
        name="DatabaseMain"
        component={DatabaseScreen}
        options={{ title: "Database" }}
      />
      <DatabaseStackNav.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ title: "Report" }}
      />
    </DatabaseStackNav.Navigator>
  );
}

/** Root tabs */
export default function RootNavigator() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="HomeTab" component={HomeStack} options={{ title: "Home" }} />
      <Tabs.Screen
        name="DatabaseTab"
        component={DatabaseStack}
        options={{ title: "Database" }}
      />
      <Tabs.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Tabs.Navigator>
  );
}