// src/navigation/RootNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '@/screens/HomeScreen';
import ScanScreen from '@/screens/ScanScreen';
import VerifyScreen from '@/screens/VerifyScreen';
import DatabaseScreen from '@/screens/DatabaseScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerTitle: 'Job Scam Detector' }} />
    </Stack.Navigator>
  );
}

function ScanStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ScanMain" component={ScanScreen} options={{ headerTitle: 'Scan a Job Post' }} />
      <Stack.Screen name="Verify" component={VerifyScreen} options={{ headerTitle: 'Verify Company' }} />
    </Stack.Navigator>
  );
}

function DatabaseStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DatabaseMain" component={DatabaseScreen} options={{ headerTitle: 'Database' }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ headerTitle: 'Settings' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // headers come from the stacks above
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
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Scan" component={ScanStack} />
      <Tab.Screen name="Database" component={DatabaseStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}