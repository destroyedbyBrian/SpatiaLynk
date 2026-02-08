// app/(admin)/approvals.tsx
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function ApprovalsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchPendingRequests();
    }, []),
  );

  async function fetchPendingRequests() {
    setLoading(true);
    console.log("🔍 Fetching pending requests...");

    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("👤 Current User ID:", session?.user.id);

    const { data, error } = await supabase
      .from("pois")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching approvals:", error.message);
      Alert.alert("Error", error.message);
    } else {
      console.log("✅ Data fetched successfully. Count:", data?.length);
      if (data && data.length > 0) {
        console.log("📄 First item sample:", JSON.stringify(data[0], null, 2));
      } else {
        console.log(
          "📭 The list is empty. (Ensure rows have status='pending')",
        );
      }
      setRequests(data || []);
    }
    setLoading(false);
  }

  async function handleDecision(id: string, decision: "active" | "rejected") {
    Alert.alert("Confirm", `Mark this shop as ${decision}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          const { error } = await supabase
            .from("pois")
            .update({ status: decision })
            .eq("poi_id", id);

          if (error) {
            console.error("Update error:", error.message);
            Alert.alert("Error", error.message);
          } else {
            fetchPendingRequests(); // Refresh list
          }
        },
      },
    ]);
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.images?.[0] || "https://via.placeholder.com/150" }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>
          {item.category} • {item.district}
        </Text>
        <Text numberOfLines={2} style={styles.desc}>
          {item.characteristic}
        </Text>
        <Text style={{ fontSize: 12, color: "orange", marginBottom: 10 }}>
          Status: {item.status}
        </Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            onPress={() => handleDecision(item.poi_id, "rejected")}
          >
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.approveBtn]}
            onPress={() => handleDecision(item.poi_id, "active")}
          >
            <Text style={styles.btnText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Requests</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#d32f2f" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.poi_id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Text style={styles.empty}>No pending requests found.</Text>
              <Text style={{ color: "#999", fontSize: 12, marginTop: 5 }}>
                (Check console log if you think this is wrong)
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333" },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
  },
  image: { width: "100%", height: 150 },
  content: { padding: 15 },
  title: { fontSize: 18, fontWeight: "bold" },
  subtitle: { color: "#666", marginBottom: 5 },
  desc: { color: "#444", fontSize: 12, marginBottom: 15 },
  btnRow: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  approveBtn: { backgroundColor: "#27ae60" },
  rejectBtn: { backgroundColor: "#c0392b" },
  btnText: { color: "white", fontWeight: "bold" },
  empty: { textAlign: "center", color: "#666", fontSize: 16 },
});
