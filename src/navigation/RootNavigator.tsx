// navigation/RootNavigator.tsx
import * as React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// --- Screens (paths match your repo tree) ---
import HomeScreen from '../screens/HomeScreen';
import DatabaseScreen from '../screens/DatabaseScreen';
import SettingsScreen from '../screens/SettingsScreen';

// --- Types (adjust if you add routes) ---
export type HomeStackParamList = {
  Home: undefined;
};

export type DatabaseStackParamList = {
  Database: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  DatabaseTab: undefined;
  SettingsTab: undefined;
};

// --- Navigators ---
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DatabaseStack = createNativeStackNavigator<DatabaseStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerLargeTitle: Platform.OS === 'ios',
        headerTransparent: false,
      }}
    >
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
    </HomeStack.Navigator>
  );
}

function DatabaseStackNavigator() {
  return (
    <DatabaseStack.Navigator
      screenOptions={{
        headerLargeTitle: Platform.OS === 'ios',
        headerTransparent: false,
      }}
    >
      <DatabaseStack.Screen
        name="Database"
        component={DatabaseScreen}
        options={{ title: 'Saved Analyses' }}
      />
    </DatabaseStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerLargeTitle: Platform.OS === 'ios',
        headerTransparent: false,
      }}
    >
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </SettingsStack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // stacks render their own headers
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#9aa0a6',
        tabBarStyle: {
          backgroundColor: '#111318',
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarIcon: ({ color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'DatabaseTab') icon = 'archive';
          if (route.name === 'SettingsTab') icon = 'settings';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="DatabaseTab"
        component={DatabaseStackNavigator}
        options={{ title: 'Database' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}