// app/index.tsx
// Purpose: App Main Entry (Dispatcher)
// Logic: Check Login Status -> Check Role -> Redirect to (tabs), (business), or (admin)

import { router, useRootNavigationState } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../services/supabase";

export default function Index() {
  const [checking, setChecking] = useState(true);
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Ensure the navigation tree is ready before execution
    if (!rootNavigationState?.key) return;

    const checkUser = async () => {
      try {
        // 1. Get current Session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session) {
          // 2. Logged in -> Check Role
          const { data: user, error: roleError } = await supabase
            .from("users")
            .select("role")
            .eq("auth_id", session.user.id)
            .single();

          if (roleError) {
            // Role not found, fallback to standard user page
            router.replace("/(tabs)" as any);
          } else if (user?.role === "business") {
            // 💼 Business -> Go to Business Dashboard
            router.replace("/(business)" as any);
          } else if (user?.role === "admin") {
            // 🛡️ Admin -> Go to Admin Dashboard
            router.replace("/(admin)" as any);
          } else {
            // 👤 Standard User -> Go to Explore Page
            router.replace("/(tabs)" as any);
          }
        } else {
          // 3. Not logged in -> Guest Mode (Go to Login or Explore Page)
          router.replace("/(tabs)" as any);
        }
      } catch (e) {
        // 4. Error Fallback
        console.error("Entry check error:", e);
        router.replace("/(tabs)" as any);
      } finally {
        setChecking(false);
      }
    };

    checkUser();
  }, [rootNavigationState?.key]);

  // Loading Animation
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
