// app/(admin)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function AdminDashboard() {
  const [dbStatus, setDbStatus] = useState("Checking...");
  const [latency, setLatency] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // 🔄 Auto-refresh data whenever the screen comes into focus
  // (e.g., when you return from the Approvals screen)
  useFocusEffect(
    useCallback(() => {
      runAllChecks();
    }, []),
  );

  async function runAllChecks() {
    setRefreshing(true);
    await Promise.all([checkSystemHealth(), fetchPendingCount()]);
    setRefreshing(false);
  }

  async function checkSystemHealth() {
    const start = Date.now();
    // Simple Ping: Check connection by counting users (head: true means don't download data)
    const { error } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true });
    const end = Date.now();

    if (error) {
      setDbStatus("Error ❌");
    } else {
      setDbStatus("Operational ✅");
      setLatency(end - start);
    }
  }

  async function fetchPendingCount() {
    // Count how many POIs are waiting for approval
    const { count } = await supabase
      .from("pois")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    setPendingCount(count || 0);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/(tabs)" as any);
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={runAllChecks} />
      }
    >
      <Text style={styles.title}>Admin Control Panel</Text>

      {/* 🏥 System Health Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>System Health Monitor</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Database Status:</Text>
          <Text
            style={[
              styles.value,
              { color: dbStatus.includes("Error") ? "#c0392b" : "#27ae60" },
            ]}
          >
            {dbStatus}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Latency:</Text>
          <Text style={styles.value}>{latency} ms</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={runAllChecks}>
          <Text style={styles.btnText}>Run Diagnostics</Text>
        </TouchableOpacity>
      </View>

      {/* 📊 Quick Actions Grid */}
      <View style={styles.grid}>
        {/* Pending Approvals Button */}
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push("/(admin)/approvals" as any)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={28} color="#e67e22" />
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending Requests</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: "#ffebee" }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={32} color="#c0392b" />
          <Text
            style={[
              styles.statLabel,
              { marginTop: 10, color: "#c0392b", fontWeight: "bold" },
            ]}
          >
            Log Out
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>Pull down to refresh dashboard</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20,
    color: "#2c3e50",
  },

  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#34495e",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  label: { fontSize: 16, color: "#7f8c8d" },
  value: { fontSize: 16, fontWeight: "700" },

  refreshBtn: {
    marginTop: 15,
    backgroundColor: "#2c3e50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "600", fontSize: 14 },

  grid: { flexDirection: "row", gap: 15 },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    minHeight: 140,
  },
  iconContainer: { position: "relative", marginBottom: 5 },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#c0392b",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },

  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 5,
    color: "#2c3e50",
  },
  statLabel: {
    fontSize: 13,
    color: "#7f8c8d",
    textAlign: "center",
    fontWeight: "500",
  },

  footerText: {
    textAlign: "center",
    marginTop: 30,
    color: "#bdc3c7",
    fontSize: 12,
  },
});
