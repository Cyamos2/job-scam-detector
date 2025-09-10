// src/navigation/types.ts

export type RootTabParamList = {
  Home: undefined;
  Database: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  ReportDetail: { id: string };
  AddContent: { editId?: string } | undefined;
};