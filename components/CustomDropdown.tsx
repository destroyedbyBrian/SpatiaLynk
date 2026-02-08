// components/CustomDropdown.tsx
import React, { useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export const CustomDropdown = ({
  label,
  value,
  options,
  onSelect,
  readOnly,
}: any) => {
  const [visible, setVisible] = useState(false);
  if (readOnly)
    return (
      <View style={styles.readOnlyField}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>{value || "未设置"}</Text>
      </View>
    );
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownBtn}
        onPress={() => setVisible(true)}
      >
        <Text style={{ color: value ? "#333" : "#999" }}>
          {value || `选择 ${label}`}
        </Text>
        <Text>▼</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择 {label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={{ color: "red" }}>关闭</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(i) => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text>{item}</Text>
                  {item === value && <Text>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  readOnlyField: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 10,
  },
  label: { fontSize: 12, color: "#666", marginBottom: 4 },
  valueText: { fontSize: 16, color: "#333", fontWeight: "500" },
  dropdownBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontWeight: "bold" },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
