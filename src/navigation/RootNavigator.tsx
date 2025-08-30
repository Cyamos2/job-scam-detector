import React from "react";
import { NavigationContainer, DefaultTheme, Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeStack from "./HomeStack";
import DatabaseStack from "./DatabaseStack";
import SettingsScreen from "../screens/SettingsScreen";

export type RootTabsParamList = {
  HomeTab: undefined;
  DatabaseTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabsParamList>();

const theme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#fff" },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "Home" }} />
        <Tab.Screen name="DatabaseTab" component={DatabaseStack} options={{ title: "Database" }} />
        <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: "Settings" }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}