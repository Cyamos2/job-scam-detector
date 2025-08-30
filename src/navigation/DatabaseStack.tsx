// src/navigation/DatabaseStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DatabaseScreen from "../screens/DatabaseScreen";
import ReportDetailScreen from "../screens/ReportDetailScreen";

export type DatabaseStackParamList = {
  DatabaseMain: undefined;
  ReportDetail: { id: string };
};

const Stack = createNativeStackNavigator<DatabaseStackParamList>();

export default function DatabaseStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DatabaseMain"
        component={DatabaseScreen}
        options={{ title: "Database" }}
      />
      <Stack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ title: "Report" }}
      />
    </Stack.Navigator>
  );
}