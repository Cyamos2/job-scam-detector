import * as React from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import type { Risk } from "../hooks/useJobs";

const riskOptions: Risk[] = ["ALL", "LOW", "MEDIUM", "HIGH"];

export function FilterBar({
  risk, setRisk, search, setSearch, onRefresh,
}: {
  risk: Risk; setRisk: (r: Risk) => void;
  search: string; setSearch: (s: string) => void;
  onRefresh?: () => void;
}) {
  return (
    <View style={{ padding: 12, gap: 8, backgroundColor: "#f7f7fb" }}>
      <TextInput
        value={search}
        placeholder="Search title or company…"
        onChangeText={setSearch}
        autoCorrect={false}
        style={{
          backgroundColor: "white",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderWidth: 1, borderColor: "#e3e3ea",
        }}
      />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {riskOptions.map((opt) => {
          const active = risk === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => setRisk(opt)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                borderWidth: 1, borderColor: active ? "#2f6fed" : "#d9dbe3",
                backgroundColor: active ? "#eaf0ff" : "white",
              }}
            >
              <Text style={{ color: active ? "#2f6fed" : "#333" }}>{opt}</Text>
            </Pressable>
          );
        })}
        {!!onRefresh && (
          <Pressable
            onPress={onRefresh}
            style={{ marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 8 }}
          >
            <Text>Refresh</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}