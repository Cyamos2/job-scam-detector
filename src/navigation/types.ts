// src/navigation/types.ts

// Bottom tabs
export type RootTabParamList = {
  Home: { screen?: keyof HomeStackParamList } | undefined;
  Scan: { screen?: keyof ScanStackParamList } | undefined;
  Database: undefined;
  Settings: undefined;
};

// Home stack
export type HomeStackParamList = {
  HomeMain: undefined;
  AddContent: { presetId?: string } | undefined; // keep any params you had
};

// Scan stack
export type ScanStackParamList = {
  ScanMain: undefined;
  Verify: { target?: string } | undefined;
};