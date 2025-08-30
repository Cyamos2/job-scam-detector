// src/navigation/HomeStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import AddContentScreen from "../screens/AddContentScreen";

export type HomeStackParamList = {
  HomeMain: undefined;
  AddContent: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: "Home" }} />
      <Stack.Screen name="AddContent" component={AddContentScreen} options={{ title: "Add Content" }} />
    </Stack.Navigator>
  );
}