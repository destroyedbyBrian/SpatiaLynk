// app/(tabs)/history.tsx
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, []),
  );

  async function fetchHistory() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const { data, error } = await supabase
        .from("search_history")
        .select("*")
        .eq("user_id", session.user.id) // 👈 Modification 1: Filter by user_id
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) console.log(error);
      else setHistory(data || []);
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Search History</Text>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No search history yet</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              {/* 👇 Modification 2: Read search_query */}
              <Text style={styles.queryText}>{item.search_query}</Text>
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  historyItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  queryText: { fontSize: 16, color: "#333", marginBottom: 4 },
  dateText: { fontSize: 12, color: "#999" },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
    fontSize: 16,
  },
});
