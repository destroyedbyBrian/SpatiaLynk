// app/(business)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function BusinessLayout() {
  return (
    <Tabs
      screenOptions={{ tabBarActiveTintColor: "#6200ea", headerShown: false }}
    >
      {/* Tab 1: Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={24} color={color} />
          ),
        }}
      />

      {/* Tab 2: Shop Management (To be implemented next) */}
      <Tabs.Screen
        name="spots"
        options={{
          title: "My Shops",
          tabBarIcon: ({ color }) => (
            <Ionicons name="storefront" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
