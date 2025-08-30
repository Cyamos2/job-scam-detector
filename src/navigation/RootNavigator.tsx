import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeStack from "./HomeStack";
import DatabaseStack from "./DatabaseStack";
import SettingsScreen from "../screens/SettingsScreen";

export type RootTabParamList = {
  HomeTab: undefined;
  DatabaseTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "Home" }} />
      <Tab.Screen name="DatabaseTab" component={DatabaseStack} options={{ title: "Database" }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: "Settings" }} />
    </Tab.Navigator>
  );
}