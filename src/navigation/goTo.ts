import { NavigationProp } from "@react-navigation/native";
import type { RootTabParamList, HomeStackParamList } from "./types";

// Navigate to AddContent inside the Home stack, with safe fallbacks.
export function goToAddContent(navigation: NavigationProp<any>) {
  const parent = navigation.getParent?.();
  if (parent) {
    // Parent is the Tab Navigator: go to the Home tab → nested screen AddContent
    parent.navigate("Home" as keyof RootTabParamList, {
      screen: "AddContent" as keyof HomeStackParamList,
    } as any);
  } else {
    // Already inside Home stack
    navigation.navigate("AddContent" as keyof HomeStackParamList);
  }
}

export function goHomeTab(navigation: NavigationProp<any>) {
  const parent = navigation.getParent?.();
  parent ? parent.navigate("Home" as keyof RootTabParamList) : navigation.navigate("Home" as never);
}