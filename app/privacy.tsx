// app/privacy.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: January 30, 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          SpatiaLynk ("we") values your privacy. This policy explains how we
          collect, use, and disclose your personal data in accordance with the
          Personal Data Protection Act (PDPA) of Singapore.
        </Text>

        <Text style={styles.sectionTitle}>2. Data We Collect</Text>
        <Text style={styles.paragraph}>
          To provide personalized recommendations, we may collect the following
          information:
          {"\n"}• Account Information (Name, Email)
          {"\n"}• Preferences (Age Group, Interests, Residential Area)
          {"\n"}• Usage Data (Search History, Browsing Records)
        </Text>

        <Text style={styles.sectionTitle}>3. Security</Text>
        <Text style={styles.paragraph}>
          We adopt industry-standard security measures to protect your data from
          unauthorized access or disclosure. Only you and authorized personnel
          can access your sensitive information.
        </Text>

        <Text style={styles.sectionTitle}>4. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions regarding this policy, please contact our
          Data Protection Officer (DPO) at privacy@spatialynk.sg.
        </Text>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", paddingTop: 50 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 10 },
  content: { padding: 20 },
  lastUpdated: { color: "#666", fontSize: 12, marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  paragraph: { fontSize: 14, color: "#555", lineHeight: 22 },
});
