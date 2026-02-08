// app/(tabs)/search.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router"; // 👈 Core tool
import React, { useCallback, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function SearchScreen() {
  const [searchText, setSearchText] = useState("");
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);

  // 🧹 Core Fix: Run every time the page "gains focus"
  useFocusEffect(
    useCallback(() => {
      let isActive = true; // Prevent state updates after component unmount

      const checkSessionAndFetch = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isActive) {
          setSession(session);
          if (session) {
            // ✅ If there is a user, fetch their data
            fetchRecentSearches(session.user.id);
          } else {
            // 🧹 If no user (guest), force clear history!
            setRecentSearches([]);
            setSearchText("");
          }
        }
      };

      checkSessionAndFetch();

      return () => {
        isActive = false;
      };
    }, []),
  );

  async function fetchRecentSearches(userId: string) {
    const { data } = await supabase
      .from("search_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    setRecentSearches(data || []);
  }

  async function handleSearch() {
    if (!searchText.trim()) return;

    if (session) {
      await supabase.from("search_history").insert({
        user_id: session.user.id,
        search_query: searchText.trim(),
      });
      fetchRecentSearches(session.user.id);
    } else {
      // If guest, can show alert or just fake search without saving
      // Here we choose not to save record
    }

    Alert.alert("Search Results", `Showing results for "${searchText}"...`);
    setSearchText("");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Search</Text>

      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={styles.input}
          placeholder="Search places, food..."
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Button title="Go" onPress={handleSearch} />
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.sectionTitle}>
          {session
            ? "Recent Searches (Last 10)"
            : "Recent Searches (Login required)"}
        </Text>

        <FlatList
          data={recentSearches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.historyItem}
              onPress={() => Alert.alert("Quick Search", item.search_query)}
            >
              <Ionicons name="time-outline" size={18} color="#666" />
              <Text style={styles.historyText}>{item.search_query}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ color: "#999", marginTop: 10 }}>
              {session
                ? "No search history yet"
                : "Guest mode does not save search history"}
            </Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white", paddingTop: 60 },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 5,
    height: 50,
  },
  input: { flex: 1, fontSize: 16, height: "100%" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyText: { marginLeft: 10, fontSize: 16, color: "#333" },
});
