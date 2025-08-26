// navigation/RootNavigator.tsx
import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import DatabaseScreen from '../screens/DatabaseScreen';
import SettingsScreen from '../screens/SettingsScreen';

// ----- Types (adjust names if you have more screens) -----
export type HomeStackParamList = {
  Home: undefined;
};

export type DatabaseStackParamList = {
  Database: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DatabaseStack = createNativeStackNavigator<DatabaseStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const Tab = createBottomTabNavigator();

// ----- Per-tab stacks with iOS large titles and safe header config -----
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerLargeTitle: Platform.OS === 'ios',
        headerTransparent: false, // keep content below the header; avoids notch overlap
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
        options={{ title: 'Saved Analyses' }} // <— native header shows this
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

// ----- Root Tabs -----
// We hide the tab-level header (so we don't have *two* headers).
export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // stacks render their own native headers
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#9aa0a6',
        tabBarStyle: {
          backgroundColor: '#111318',
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'HomeTab'
              ? 'home'
              : route.name === 'DatabaseTab'
              ? 'archive'
              : 'settings';
          return <Ionicons name={name as any} size={size} color={color} />;
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