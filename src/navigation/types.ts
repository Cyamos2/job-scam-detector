// src/navigation/types.ts
export type RootStackParamList = {
  Tabs: undefined;
  ReportDetail: { id: string };
  AddContent: { presetUri?: string } | undefined; // ✅ declare optional param
};

export type RootTabParamList = {
  Home: undefined;
  Database: undefined;
  Settings: undefined;
};