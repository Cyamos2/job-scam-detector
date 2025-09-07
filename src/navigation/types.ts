// src/navigation/types.ts

export type RootTabParamList = {
  Home: undefined;
  Database: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  ReportDetail: { id: string };
  // Allow optional editId so you can open AddContent in "edit" mode or plain "add" mode.
  AddContent: { editId?: string } | undefined;
};