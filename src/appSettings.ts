export type ThemeMode = "light" | "dark";
export type Sensitivity = "Low" | "Medium" | "High";

export type Settings = {
  theme: ThemeMode;
  sensitivity: Sensitivity;
  domainAgeBoost: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  sensitivity: "Medium",
  domainAgeBoost: true
};