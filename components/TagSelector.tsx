// components/TagSelector.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const TagSelector = ({
  label,
  options,
  selectedValues,
  onToggle,
  readOnly,
}: any) => {
  // 只读模式 (View Only)
  if (readOnly) {
    return (
      <View style={styles.readOnlyField}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>
          {selectedValues && selectedValues.length > 0
            ? selectedValues.join(", ")
            : "未设置"}
        </Text>
      </View>
    );
  }

  // 编辑模式
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.tagContainer}>
        {options.map((tag: string) => {
          const isSel = selectedValues.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, isSel && styles.tagSelected]}
              onPress={() => onToggle(tag)}
            >
              <Text style={[styles.tagText, isSel && styles.tagTextSelected]}>
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // 只读样式
  readOnlyField: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 10,
  },
  label: { fontSize: 12, color: "#666", marginBottom: 4 },
  valueText: { fontSize: 16, color: "#333", fontWeight: "500" },

  // 标签容器样式
  tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
  },
  tagSelected: {
    backgroundColor: "#e6f2ff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  tagText: { color: "#666" },
  tagTextSelected: { color: "#007AFF", fontWeight: "bold" },
});
