// src/navigation/RootNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator, NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";

import HomeScreen from "../screens/HomeScreen";
import DatabaseScreen from "../screens/DatabaseScreen";
import ReportDetailScreen from "../screens/ReportDetailScreen";
import AddContentScreen from "../screens/AddContentScreen";
import SettingsScreen from "../screens/SettingsScreen";

export type HomeStackParamList = {
  HomeMain: undefined;
  AddContent: undefined;
  ReportDetail: { id: string };
};

export type DatabaseStackParamList = {
  DatabaseMain: undefined;
  ReportDetail: { id: string };
};

export type RootTabsParamList = {
  HomeTab: undefined;
  DatabaseTab: undefined;
  SettingsTab: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DatabaseStack = createNativeStackNavigator<DatabaseStackParamList>();
const Tabs = createBottomTabNavigator<RootTabsParamList>();

function useThemedStackOptions(): NativeStackNavigationOptions {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.card },
    headerTitleStyle: { color: colors.text },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    headerBackVisible: true,
  };
}

function HomeStackNav() {
  const screenOptions = useThemedStackOptions();
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: "Home" }} />
      <HomeStack.Screen name="AddContent" component={AddContentScreen} options={{ title: "Add Content" }} />
      <HomeStack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: "Report" }} />
    </HomeStack.Navigator>
  );
}

function DatabaseStackNav() {
  const screenOptions = useThemedStackOptions();
  return (
    <DatabaseStack.Navigator screenOptions={screenOptions}>
      <DatabaseStack.Screen name="DatabaseMain" component={DatabaseScreen} options={{ title: "Database" }} />
      <DatabaseStack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: "Report" }} />
    </DatabaseStack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="HomeTab" component={HomeStackNav} options={{ title: "Home" }} />
      <Tabs.Screen name="DatabaseTab" component={DatabaseStackNav} options={{ title: "Database" }} />
      <Tabs.Screen name="SettingsTab" component={SettingsScreen} options={{ title: "Settings" }} />
    </Tabs.Navigator>
  );
}