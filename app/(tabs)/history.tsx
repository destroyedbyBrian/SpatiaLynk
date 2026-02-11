import { SafeAreaContainer } from "@/constant/GlobalStyles";
import { useUserAuthStore } from "@/store/userAuthStore";
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
  const { user } = useUserAuthStore()
  const userId = user?.id

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, []),
  );

  async function fetchHistory() {
    setLoading(true);
    
    try {
      if (!userId) {
        console.warn('User not authenticated');
        setHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from("search_history")
        .select("*")
        .eq("user_id", userId)  
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching history:', error);
        setHistory([]);
      } else {
        setHistory(data || []);
      }
      
    } catch (e) {
      console.error('Unexpected error in fetchHistory:', e);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaContainer>
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
                <Text style={styles.queryText}>{item.search_query}</Text>
                <Text style={styles.dateText}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
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
