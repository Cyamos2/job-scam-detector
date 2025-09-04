// src/navigation/types.ts
export type RootTabParamList = {
  Home: undefined;
  Database: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  AddContent: undefined;               // modal
  ReportDetail: { id: string };        // details
};