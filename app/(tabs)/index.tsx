// File path: app/(tabs)/index.tsx
// Purpose: Home page after login (Home Tab)

import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
// 👇 Fix 1: Used ../../ here because we are in the (tabs) folder, need to go up two levels
import { supabase } from "../../services/supabase";

export default function HomeScreen() {
  const [places, setPlaces] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // 👇 Fix 2: Added :any to bypass type checking
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
    });
    fetchPlaces();
  }, []);

  async function fetchPlaces() {
    const { data, error } = await supabase.from("places").select("*");
    if (error) Alert.alert("Error", error.message);
    else setPlaces(data || []);
  }

  async function handleSearch() {
    if (!searchText.trim()) return;

    Alert.alert("Searching", `Searching for: ${searchText}...`);

    if (session?.user) {
      const { error } = await supabase.from("search_history").insert({
        user_id: session.user.id,
        search_query: searchText.trim(),
      });
      if (error) console.log("Failed to save history:", error.message);
    }
    setSearchText("");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search places (e.g. Chinatown)..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <Button title="Search" onPress={handleSearch} />
      </View>

      <Text style={styles.sectionTitle}>Popular Recommendations 🔥</Text>

      {places.map((item) => (
        <View key={item.id} style={styles.card}>
          <Image
            source={{
              uri: item.image_url || "https://via.placeholder.com/300",
            }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.cardCategory}>🏷️ {item.category}</Text>
              <Text style={styles.cardRating}>⭐ {item.rating}</Text>
            </View>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </View>
      ))}

      {places.length === 0 && (
        <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
          No data available or loading...
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f5f5f5", minHeight: "100%" },
  searchSection: { flexDirection: "row", gap: 10, marginBottom: 20 },
  searchInput: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 3,
  },
  cardImage: { width: "100%", height: 150 },
  cardContent: { padding: 15 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  cardCategory: { color: "#666", fontSize: 12 },
  cardRating: { color: "#f39c12", fontWeight: "bold" },
  cardDesc: { color: "#444", marginTop: 8, fontSize: 14, lineHeight: 20 },
});
