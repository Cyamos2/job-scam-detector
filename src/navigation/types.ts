// Tabs live under the root stack
export type RootTabParamList = {
  Home: undefined;
  Database: undefined;
  Settings: undefined;
};

// Root stack wraps Tabs and detail screens
export type RootStackParamList = {
  Tabs: undefined;
  ReportDetail: { id: string }; // pushed from Database rows
};