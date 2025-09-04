// src/navigation/DatabaseStack.tsx
import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DatabaseScreen from "../screens/DatabaseScreen";
import ReportDetailScreen from "../screens/ReportDetailScreen";
import AddContentScreen from "../screens/AddContentScreen";

export type DatabaseStackParamList = {
  DatabaseHome: undefined;
  ReportDetail: { id: string };
  AddContent: { presetUri?: string } | { preset?: any } | undefined;
};

const Stack = createNativeStackNavigator<DatabaseStackParamList>();

export default function DatabaseStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DatabaseHome" component={DatabaseScreen} options={{ title: "Database" }} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: "Details" }} />
      <Stack.Screen name="AddContent" component={AddContentScreen} options={{ title: "Add Content" }} />
    </Stack.Navigator>
  );
}