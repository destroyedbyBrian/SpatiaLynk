// app/login.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Form Data
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🟢 Login Logic (Core modification here)
  async function signIn() {
    if (!email || !password) {
      Alert.alert("Notice", "Please enter email and password");
      return;
    }
    setLoading(true);

    try {
      // 1. Attempt login first (Verify credentials)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // 2. After successful login, query user status and role
      if (data.session) {
        console.log("Login successful, fetching user details...");

        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("is_active, role") // 🔥 Query two fields at once
          .eq("auth_id", data.session.user.id)
          .single();

        if (profileError) {
          console.error("Failed to fetch user info:", profileError);
          // If no profile found, default to standard user page to avoid getting stuck
          router.replace("/(tabs)" as any);
          return;
        }

        // 🛑 Check if account is deactivated
        if (userProfile && userProfile.is_active === false) {
          await supabase.auth.signOut(); // Force sign out
          Alert.alert(
            "Login Denied",
            "Your account has been deactivated. Please contact the administrator.",
          );
          setLoading(false);
          return; // Stop function, do not redirect
        }

        // 🚦 Core Dispatcher Logic (Updated with Admin check)
        if (userProfile?.role === "business") {
          console.log("💼 Identified as Business -> Redirecting to Business");
          router.replace("/(business)" as any);
        } else if (userProfile?.role === "admin") {
          // 👇 Added this block for Admin
          console.log("🛡️ Identified as Admin -> Redirecting to Admin");
          router.replace("/(admin)" as any);
        } else {
          console.log("👤 Identified as Standard User -> Redirecting to Tabs");
          router.replace("/(tabs)" as any);
        }
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      // Only stop loading if error keeps user on current page
      // If redirected, component unmounts, so not setting false is fine
      setLoading(false);
    }
  }

  // 🟡 Registration Logic
  async function signUpStep1() {
    if (!email || !password || !fullName) {
      Alert.alert("Notice", "Please fill in all information");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: { data: { full_name: fullName } }, // Write to metadata
      });

      if (error) throw error;

      // Usually auto-login after successful registration
      if (data.session) {
        // New users are usually free_user by default, go to tabs
        router.replace("/(tabs)" as any);
      } else {
        // If Supabase email verification is enabled, session might be null
        Alert.alert(
          "Registration Successful",
          "Please check your email for the verification link, or log in directly.",
        );
        setIsRegistering(false); // Switch back to login state
      }
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 🔙 Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={30} color="#333" />
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>
          {isRegistering ? "Sign Up" : "SpatiaLynk Login"}
        </Text>

        {isRegistering && (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              onChangeText={setFullName}
              value={fullName}
              placeholder="e.g., Mike"
            />
          </>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          onChangeText={setEmail}
          value={email}
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          onChangeText={setPassword}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize="none"
        />

        <Button
          title={loading ? "Processing..." : isRegistering ? "Next" : "Login"}
          onPress={isRegistering ? signUpStep1 : signIn}
          disabled={loading}
        />

        <TouchableOpacity
          style={{ marginTop: 20, alignItems: "center" }}
          onPress={() => setIsRegistering(!isRegistering)}
        >
          <Text style={{ color: "#007AFF" }}>
            {isRegistering ? "Have an account? Login" : "Register New Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 30, alignItems: "center" }}
          onPress={() => router.push("/privacy" as any)}
        >
          <Text
            style={{
              color: "#999",
              fontSize: 12,
              textDecorationLine: "underline",
            }}
          >
            Read Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  backBtn: { position: "absolute", top: 50, right: 20, zIndex: 10 },
  card: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 15,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: { marginBottom: 8, color: "#333", fontWeight: "bold" },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
});
