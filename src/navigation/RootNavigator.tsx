// src/navigation/RootNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '@/screens/HomeScreen';
import AddContentScreen from '@/screens/AddContentScreen';

import ScanScreen from '@/screens/ScanScreen';
import VerifyScreen from '@/screens/VerifyScreen';

import DatabaseScreen from '@/screens/DatabaseScreen';
import SettingsScreen from '@/screens/SettingsScreen';

import type { RootTabParamList, HomeStackParamList, ScanStackParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ScanStack = createNativeStackNavigator<ScanStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerTitle: 'Job Scam Detector' }}
      />
      <HomeStack.Screen
        name="AddContent"
        component={AddContentScreen}
        options={{ headerTitle: 'Add Content' }}
      />
    </HomeStack.Navigator>
  );
}

function ScanStackNavigator() {
  return (
    <ScanStack.Navigator>
      <ScanStack.Screen
        name="ScanMain"
        component={ScanScreen}
        options={{ headerTitle: 'Scan a Job Post' }}
      />
      <ScanStack.Screen
        name="Verify"
        component={VerifyScreen}
        options={{ headerTitle: 'Verify Company' }}
      />
    </ScanStack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // headers come from the stacks
        tabBarActiveTintColor: '#FF5733',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = 'ellipse';
          if (route.name === 'Home') icon = focused ? 'home' : 'home-outline';
          if (route.name === 'Scan') icon = focused ? 'camera' : 'camera-outline';
          if (route.name === 'Database') icon = focused ? 'list' : 'list-outline';
          if (route.name === 'Settings') icon = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Scan" component={ScanStackNavigator} />
      <Tab.Screen
        name="Database"
        component={DatabaseScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}