// src/navigation/RootNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator, NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";

// Screens
import HomeScreen from "../screens/HomeScreen";
import AddContentScreen from "../screens/AddContentScreen";
import ReportDetailScreen from "../screens/ReportDetailScreen";
import DatabaseScreen from "../screens/DatabaseScreen";
import SettingsScreen from "../screens/SettingsScreen";

/** ---------- Param types (exported so other files can import) ---------- */
export type HomeStackParamList = {
  HomeMain: undefined;
  AddContent: undefined;
  ReportDetail: { id: string };
};

export type DatabaseStackParamList = {
  DatabaseMain: undefined;
  ReportDetail: { id: string };
};

export type RootTabParamList = {
  HomeTab: undefined;
  DatabaseTab: undefined;
  SettingsTab: undefined;
};

/** ---------- Navigators ---------- */
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DatabaseStack = createNativeStackNavigator<DatabaseStackParamList>();
const Tabs = createBottomTabNavigator<RootTabParamList>();

/** Shared stack header styling that follows theme */
function useThemedStackOptions(): NativeStackNavigationOptions {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.card },
    headerTitleStyle: { color: colors.text },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    headerBackVisible: true, // or false if you want to hide it
  };
}

function HomeStackNavigator() {
  const opts = useThemedStackOptions();
  return (
    <HomeStack.Navigator screenOptions={opts}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: "Home" }} />
      <HomeStack.Screen name="AddContent" component={AddContentScreen} options={{ title: "Add Content" }} />
      <HomeStack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: "Report" }} />
    </HomeStack.Navigator>
  );
}

function DatabaseStackNavigator() {
  const opts = useThemedStackOptions();
  return (
    <DatabaseStack.Navigator screenOptions={opts}>
      <DatabaseStack.Screen name="DatabaseMain" component={DatabaseScreen} options={{ title: "Database" }} />
      <DatabaseStack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: "Report" }} />
    </DatabaseStack.Navigator>
  );
}

/** Bottom tabs show only once (stacks render the headers) */
export default function RootNavigator() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: "Home" }} />
      <Tabs.Screen name="DatabaseTab" component={DatabaseStackNavigator} options={{ title: "Database" }} />
      <Tabs.Screen name="SettingsTab" component={SettingsScreen} options={{ title: "Settings" }} />
    </Tabs.Navigator>
  );
}