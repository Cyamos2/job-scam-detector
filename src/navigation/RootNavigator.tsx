// src/navigation/RootNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import DatabaseScreen from "../screens/DatabaseScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ReportDetailScreen from "../screens/ReportDetailScreen";
import AddContentScreen from "../screens/AddContentScreen"; // <-- ensure this exists

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function TabsNav() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={TabsNav} options={{ headerShown: false }} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: "Report" }} />
      <Stack.Screen
        name="AddContent"
        component={AddContentScreen}
        options={{ presentation: "modal", title: "Add Content" }}
      />
    </Stack.Navigator>
  );
}