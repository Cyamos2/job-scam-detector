// src/navigation/goTo.ts
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "./types";
import type { RootTabParamList } from "./types";

/**
 * Navigate to the AddContent modal no matter whether the caller is a Tab screen
 * or a Stack screen. If the current navigator has a parent (the root stack),
 * we call navigate on that parent.
 */
export function goToAddContent(nav: any) {
  const parent = typeof nav?.getParent === "function" ? nav.getParent() : undefined;
  const target = parent ?? nav;
  target?.navigate?.("AddContent");
}

export function goToReportDetail(nav: any, id: string) {
  const parent = typeof nav?.getParent === "function" ? nav.getParent() : undefined;
  const target = parent ?? nav;
  target?.navigate?.("ReportDetail", { id });
}