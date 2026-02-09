// app/(admin)/analytics.tsx
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPOIs: 0,
    topSearches: [] as { term: string; count: number }[],
    popularPOIs: [] as any[],
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    // 1. Get Total Users count
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // 2. Get Total POIs count
    const { count: poiCount } = await supabase
      .from("pois")
      .select("*", { count: "exact", head: true });

    // 3. Analyze Search History (Client-side aggregation for demo)
    // Fetch last 100 searches to get a good sample size
    const { data: history } = await supabase
      .from("search_history")
      .select("search_query")
      .limit(100)
      .order("created_at", { ascending: false });

    // Calculate frequency
    const freqMap: Record<string, number> = {};
    history?.forEach((h: any) => {
      if (h.search_query) {
        const q = h.search_query.toLowerCase(); // Case insensitive
        freqMap[q] = (freqMap[q] || 0) + 1;
      }
    });

    // Sort and get Top 5
    const sortedSearches = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, count]) => ({ term, count }));

    // 4. Fetch Most Popular POIs (Based on 'popularity' column)
    const { data: popularPOIs } = await supabase
      .from("pois")
      .select("name, popularity, category, district")
      .order("popularity", { ascending: false })
      .limit(5);

    setStats({
      totalUsers: userCount || 0,
      totalPOIs: poiCount || 0,
      topSearches: sortedSearches,
      popularPOIs: popularPOIs || [],
    });
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>Platform Analytics</Text>

      {/* 📊 Section 1: Overview Cards */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Ionicons name="people" size={24} color="#d32f2f" />
          <Text style={styles.number}>{stats.totalUsers}</Text>
          <Text style={styles.label}>Total Users</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="location" size={24} color="#d32f2f" />
          <Text style={styles.number}>{stats.totalPOIs}</Text>
          <Text style={styles.label}>Active POIs</Text>
        </View>
      </View>

      {/* 🔍 Section 2: Top Searches */}
      <Text style={styles.subHeader}>Top User Searches</Text>
      <View style={styles.listContainer}>
        {stats.topSearches.length === 0 ? (
          <Text style={styles.emptyText}>No search data available yet.</Text>
        ) : (
          stats.topSearches.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Text style={styles.term}>{item.term}</Text>
              <Text style={styles.count}>{item.count} hits</Text>
              {/* Simple Bar Chart Visualization */}
              <View
                style={[
                  styles.bar,
                  { width: Math.min(item.count * 10, 100) }, // Dynamic width
                ]}
              />
            </View>
          ))
        )}
      </View>

      {/* 🔥 Section 3: Most Popular POIs */}
      <Text style={styles.subHeader}>Most Popular Locations</Text>
      <View style={styles.listContainer}>
        {stats.popularPOIs.length === 0 ? (
          <Text style={styles.emptyText}>No popularity data available.</Text>
        ) : (
          stats.popularPOIs.map((poi, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.rankBadge, { backgroundColor: "#f39c12" }]}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.term}>{poi.name}</Text>
                <Text style={styles.subText}>
                  {poi.category} • {poi.district}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.count, { color: "#e67e22" }]}>
                  {poi.popularity}
                </Text>
                <Text style={{ fontSize: 10, color: "#999" }}>Score</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 20 },
  header: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
    color: "#2c3e50",
  },
  row: { flexDirection: "row", gap: 15, marginBottom: 30 },
  card: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  number: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2c3e50",
    marginVertical: 5,
  },
  label: { color: "#7f8c8d", fontSize: 14, fontWeight: "600" },
  subHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    color: "#34495e",
    marginTop: 10,
  },
  listContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 5,
    elevation: 2,
    marginBottom: 20,
  },
  listItem: {
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
    alignItems: "center",
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#d32f2f",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  rankText: { color: "white", fontWeight: "bold", fontSize: 12 },
  term: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  subText: { fontSize: 12, color: "#95a5a6", marginTop: 2 },
  count: { fontWeight: "bold", fontSize: 14, color: "#7f8c8d" },
  bar: {
    position: "absolute",
    bottom: 2,
    left: 55,
    height: 3,
    backgroundColor: "#ffcdd2",
    borderRadius: 2,
  },
  emptyText: { padding: 20, color: "#999", textAlign: "center" },
});
