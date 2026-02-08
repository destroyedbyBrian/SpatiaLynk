// app/(admin)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#d32f2f" }}>
      {/* Red accent color for Admin Interface */}

      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Ionicons name="speedometer-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="users"
        // 👆 Since your file is named 'users.tsx', this must be 'users'
        options={{
          title: "Users",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="approvals"
        options={{
          title: "Approvals",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="checkmark-done-circle-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
