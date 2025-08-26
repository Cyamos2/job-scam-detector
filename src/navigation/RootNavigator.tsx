import React, { useMemo } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../theme";
import { useSettings } from "../hooks/useSettings";

import HomeScreen from "../screens/HomeScreen";
import VerifyScreen from "../screens/VerifyScreen";
import ScanScreen from "../screens/ScanScreen";
import DatabaseScreen from "../screens/DatabaseScreen";
import SettingsScreen from "../screens/SettingsScreen";

type HomeStackParamList = {
  Home: undefined;
  Verify: undefined;
  Scan: undefined;
};
type DatabaseStackParamList = { Database: undefined };
type SettingsStackParamList = { Settings: undefined };

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DatabaseStack = createNativeStackNavigator<DatabaseStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text, fontWeight: "800" },
        headerShadowVisible: false
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <HomeStack.Screen name="Verify" component={VerifyScreen} options={{ title: "Verify" }} />
      <HomeStack.Screen name="Scan" component={ScanScreen} options={{ title: "Scan" }} />
    </HomeStack.Navigator>
  );
}

function DatabaseStackScreen() {
  return (
    <DatabaseStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text, fontWeight: "800" },
        headerShadowVisible: false
      }}
    >
      <DatabaseStack.Screen
        name="Database"
        component={DatabaseScreen}
        options={{ title: "Saved Analyses" }}
      />
    </DatabaseStack.Navigator>
  );
}

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text, fontWeight: "800" },
        headerShadowVisible: false
      }}
    >
      <SettingsStack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </SettingsStack.Navigator>
  );
}

export default function RootNavigator() {
  const { settings } = useSettings();

  const navTheme = useMemo(() => {
    const isDark = settings.theme === "dark";
    return {
      ...DefaultTheme,
      dark: isDark,
      colors: {
        ...DefaultTheme.colors,
        background: theme.colors.bg,
        card: theme.colors.card,
        text: theme.colors.text,
        border: theme.colors.border,
        primary: theme.colors.primary,
        notification: "#ff453a"
      }
    };
  }, [settings.theme]);

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.colors.text,
          tabBarInactiveTintColor: theme.colors.hint,
          tabBarStyle: { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border },
          tabBarIcon: ({ focused, color, size }) => {
            let name: keyof typeof Ionicons.glyphMap = "home-outline";
            if (route.name === "Home") name = focused ? "home" : "home-outline";
            if (route.name === "Database") name = focused ? "albums" : "albums-outline";
            if (route.name === "Settings") name = focused ? "settings" : "settings-outline";
            return <Ionicons name={name} size={size} color={color} />;
          }
        })}
      >
        <Tab.Screen name="Home" component={HomeStackScreen} />
        <Tab.Screen name="Database" component={DatabaseStackScreen} />
        <Tab.Screen name="Settings" component={SettingsStackScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}