// src/navigation/goTo.ts
export function goToAddContent(navigation: any) {
  navigation.getParent()?.navigate("HomeTab", { screen: "AddContent" } as any);
}
export function goHomeTab(navigation: any) {
  navigation.getParent()?.navigate("HomeTab" as any);
}
export function goDatabaseTab(navigation: any) {
  navigation.getParent()?.navigate("DatabaseTab" as any);
}