import * as React from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import type { Risk } from "../lib/api";

// include "all" + your API Risk literals (all lowercase)
export type RiskFilter = "all" | Risk;

const riskOptions: RiskFilter[] = ["all", "low", "medium", "high"];

export function FilterBar({
  risk,
  setRisk,
  search,
  setSearch,
  onRefresh,
}: {
  risk: RiskFilter;
  setRisk: (r: RiskFilter) => void;
  search: string;
  setSearch: (s: string) => void;
  onRefresh?: () => void;
}) {
  const { colors, dark } = useTheme();

  return (
    <View style={{ padding: 12, gap: 8, backgroundColor: colors.background }}>
      <TextInput
        value={search}
        placeholder="Search title or company…"
        onChangeText={setSearch}
        autoCorrect={false}
        placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
        style={{
          backgroundColor: colors.card,
          color: colors.text,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: colors.border,
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
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? "#FF5733" : colors.border,
                backgroundColor: active
                  ? dark
                    ? "#261512"
                    : "#fff4f1"
                  : colors.card,
              }}
            >
              <Text style={{ color: active ? "#FF5733" : colors.text, fontWeight: "700" }}>
                {opt.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}

        {!!onRefresh && (
          <Pressable
            onPress={onRefresh}
            style={{ marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 8 }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>Refresh</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}