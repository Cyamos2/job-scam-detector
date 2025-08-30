// src/navigation/SettingsStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "../screens/SettingsScreen";

export type SettingsStackParamList = { SettingsMain: undefined };

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: "Settings" }} />
    </Stack.Navigator>
  );
}