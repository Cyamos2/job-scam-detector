import React from "react";
import { View, TextInput, StyleSheet, Pressable, Text } from "react-native";
import { CommonActions } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";

type Props = NativeStackScreenProps<DatabaseStackParamList, "DatabaseMain">;

export default function DatabaseScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <TextInput placeholder="Search title/flags/preview" style={styles.search} />
      {/* … your list … */}

      {/* FAB → HomeTab/AddContent (no loop) */}
      <Pressable
        style={styles.fab}
        onPress={() =>
          navigation.getParent()?.dispatch(
            CommonActions.navigate({ name: "HomeTab", params: { screen: "AddContent" } })
          )
        }
        accessibilityLabel="Add content"
      >
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  search: { margin: 16, padding: 12, borderWidth: 1, borderRadius: 10, borderColor: "#ddd" },
  fab: {
    position: "absolute", right: 18, bottom: 28,
    width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
    backgroundColor: "#1E6DFF", elevation: 5,
  },
  fabPlus: { color: "white", fontSize: 28, fontWeight: "700", lineHeight: 30 },
});