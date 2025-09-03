// src/navigation/RootNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import VerifyScreen from '../screens/VerifyScreen';
import DatabaseScreen from '../screens/DatabaseScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerTitle: 'Job Scam Detector' }}
      />
    </Stack.Navigator>
  );
}

function ScanStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ScanMain"
        component={ScanScreen}
        options={{ headerTitle: 'Scan a Job Post' }}
      />
      <Stack.Screen
        name="Verify"
        component={VerifyScreen}
        options={{ headerTitle: 'Verify Company' }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF5733',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Scan':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'Database':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Scan" component={ScanStack} />
      <Tab.Screen name="Database" component={DatabaseScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}