import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import AddContentScreen from "../screens/AddContentScreen";

export type HomeStackParamList = {
  Home: undefined;
  AddContent: undefined; // 👈 must exist with this exact name
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Stack.Screen name="AddContent" component={AddContentScreen} options={{ title: "Add Content" }} />
    </Stack.Navigator>
  );
}