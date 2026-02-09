// app/(business)/index.tsx
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../services/supabase";

export default function BusinessDashboard() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email || "");
    });
  }, []);

  async function signOut() {
    // 1. Perform sign out
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Error", error.message);

    // 2. 🛑 Critical Change: Go directly to (tabs) as a guest, do not go to '/' (root entry)
    // This avoids the automatic check logic in app/index.tsx
    router.replace("/(tabs)" as any);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💼</Text>
      <Text style={styles.title}>Welcome, Owner!</Text>
      <Text style={styles.subtitle}>{email}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Data Overview</Text>
        <Text style={styles.cardContent}>
          You currently haven&apos;t published any shops.
        </Text>
        <Text style={styles.cardContent}>
          Click &apos;My Shops&apos; at the bottom to start uploading.
        </Text>
      </View>

      <Button title="Log Out" onPress={signOut} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  emoji: { fontSize: 50, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 5, color: "#333" },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 30 },
  card: {
    width: "100%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    marginBottom: 30,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  cardContent: { color: "#666", lineHeight: 22, marginBottom: 5 },
});
