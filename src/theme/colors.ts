// Scamicide Color Palette
// Consistent colors used throughout the app

export const colors = {
  // Primary brand color
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#3B82F6",
  
  // Risk level colors
  risk: {
    high: {
      bg: "#FEE2E2",
      border: "#FCA5A5",
      text: "#DC2626",
      lightBg: "#FEF2F2",
      lightBorder: "#FECACA",
    },
    medium: {
      bg: "#FEF3C7",
      border: "#FCD34D",
      text: "#D97706",
      lightBg: "#FFFBEB",
      lightBorder: "#FDE68A",
    },
    low: {
      bg: "#ECFDF5",
      border: "#A7F3D0",
      text: "#047857",
      lightBg: "#F0FDF4",
      lightBorder: "#BBF7D0",
    },
  },
  
  // Grays
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  
  // Functional colors
  error: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#3B82F6",
} as const;

export type RiskLevel = "high" | "medium" | "low";

export const getRiskColors = (level: RiskLevel) => colors.risk[level];
