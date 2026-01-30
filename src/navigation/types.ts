// src/navigation/types.ts

import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

/** Bottom tabs in the app */
export type RootTabParamList = {
  Home: undefined;
  Database: undefined;
  Settings: undefined;
};

/** Stack that hosts the Tabs + modals/detail screens */
export type RootStackParamList = {
  Tabs: undefined;
  AddContent: { editId?: string } | undefined;
  ReportDetail: { id: string };
};

/** Handy composite nav type if you need both */
export type RootNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;