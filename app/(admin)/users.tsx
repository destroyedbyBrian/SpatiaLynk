// app/(admin)/users.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function UserManagement() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Search Users
  async function searchUsers() {
    if (!query.trim()) return;
    setLoading(true);

    // 🔥 Fix 1: Ensure we query 'auth_id' (explicitly needed for matching later)
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", `%${query}%`);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  // 2. Toggle Status (Suspend/Active)
  // 🔥 Fix 2: Renamed parameter to 'targetAuthId' for clarity
  async function toggleStatus(targetAuthId: string, currentStatus: boolean) {
    const newStatus = !currentStatus;

    // 🔥 Fix 3: Must use 'auth_id' to locate user, NOT 'id'
    const { error } = await supabase
      .from("users")
      .update({ is_active: newStatus })
      .eq("auth_id", targetAuthId); // 👈 Critical: Match by auth_id

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert(
        "Success",
        `User has been ${newStatus ? "Reactivated" : "Suspended"}.`,
      );
      // Update local list state using auth_id matching
      setUsers(
        users.map((u) =>
          u.auth_id === targetAuthId ? { ...u, is_active: newStatus } : u,
        ),
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Search user by email..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={searchUsers}>
          <Ionicons name="search" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={users}
          // 🔥 Fix 4: Use 'auth_id' for the key extractor
          keyExtractor={(item) => item.auth_id}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
              No users found
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.role}>Role: {item.role}</Text>
                <Text
                  style={[
                    styles.status,
                    { color: item.is_active ? "green" : "red" },
                  ]}
                >
                  {item.is_active ? "● Active" : "● Suspended"}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: item.is_active ? "#c0392b" : "#27ae60" },
                ]}
                // 🔥 Fix 5: Pass item.auth_id to the function
                onPress={() => toggleStatus(item.auth_id, item.is_active)}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {item.is_active ? "Suspend" : "Activate"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  searchBox: { flexDirection: "row", gap: 10, marginBottom: 20 },
  input: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchBtn: {
    backgroundColor: "#333",
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  userCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
  },
  email: { fontSize: 16, fontWeight: "bold" },
  role: { color: "#666", fontSize: 12 },
  status: { fontSize: 12, marginTop: 4, fontWeight: "bold" },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
});
