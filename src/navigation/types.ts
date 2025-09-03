// Bottom tab names MUST match your <Tab.Screen name="..."> in RootNavigator
export type RootTabParamList = {
  Home: undefined;
  Scan: undefined;
  Database: undefined;
  Settings: undefined;
};

// ----- Home tab's nested stack -----
export type HomeStackParamList = {
  HomeMain: undefined;
  AddContent: undefined;
  // ReportDetail?: { id: string }
};

// ----- Scan tab's nested stack -----
// You are using a screen named "Verify" here, so include it.
// Keep "ScanMain" as optional for compatibility if you have it anywhere.
export type ScanStackParamList = {
  Verify: undefined;
  ScanMain?: undefined;
  // ScanDetail?: { id: string }
};

// ----- Database tab's nested stack -----
export type DatabaseStackParamList = {
  DatabaseMain: undefined;
  // JobDetail?: { id: string }
};

// ----- Settings tab's nested stack -----
export type SettingsStackParamList = {
  SettingsMain: undefined;
  // About?: undefined
};

// SafeNav helper: strong typing when keys match, graceful fallback otherwise
export type SafeNav<TParams, K extends keyof any> =
  K extends keyof TParams
    ? import("@react-navigation/native").NavigationProp<Record<K, TParams[K]>>
    : any;