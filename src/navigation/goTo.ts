// src/navigation/goTo.ts
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "./types";
import type { RootTabParamList } from "./types";

/**
 * Navigate to the AddContent modal no matter whether the caller is a Tab screen
 * or a Stack screen. If the current navigator has a parent (the root stack),
 * we call navigate on that parent.
 */
export function goToAddContent(nav: NavigationProp<RootTabParamList> | NavigationProp<RootStackParamList>) {
  const parent = typeof nav?.getParent === "function" ? (nav.getParent() as NavigationProp<RootStackParamList>) : undefined;
  const target = parent ?? nav;
  // Narrow to the root stack nav so the overloads line up and TS allows the call
  const rootNav = target as NavigationProp<RootStackParamList>;
  rootNav.navigate("AddContent");
}

export function goToReportDetail(nav: NavigationProp<RootTabParamList> | NavigationProp<RootStackParamList>, id: string) {
  const parent = typeof nav?.getParent === "function" ? (nav.getParent() as NavigationProp<RootStackParamList>) : undefined;
  const target = parent ?? nav;
  const rootNav = target as NavigationProp<RootStackParamList>;
  rootNav.navigate("ReportDetail", { id });
}