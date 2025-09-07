// src/navigation/types.ts
export type RootStackParamList = {
  Tabs: undefined; // bottom tab navigator
  ReportDetail: { id: string }; // requires job id
  AddContent: { editId?: string }; // optional editId param
};

export type TabsParamList = {
  Home: undefined;
  Database: undefined;
  Settings: undefined;
};