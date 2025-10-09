// src/navigation/RootNavigator.tsx
import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { RootStackParamList, RootTabParamList } from "./types";

// Screens
import HomeScreen from "../screens/HomeScreen";
import DatabaseScreen from "../screens/DatabaseScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AddContentScreen from "../screens/AddContentScreen";
import ReportDetailScreen from "../screens/ReportDetailScreen";
import ScanScreen from "../screens/ScanScreen";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Database" component={DatabaseScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="AddContent" component={AddContentScreen} options={{ title: "Add Job" }} />
      <Stack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ title: "Report" }}
      />
      <Stack.Screen
        name="ScanScreen"
        component={ScanScreen}
        options={{ title: "Pick Screenshot" }}
      />
    </Stack.Navigator>
  );
}