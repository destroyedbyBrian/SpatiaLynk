// app/(tabs)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomDropdown } from "../../components/CustomDropdown";
import { TagSelector } from "../../components/TagSelector";
import {
  AGE_RANGES,
  INTEREST_TAGS,
  PRICE_LEVELS,
  SG_AREAS,
  TRANSPORT_TAGS,
} from "../../constant/constants";
import { supabase } from "../../services/supabase";

export default function MeScreen() {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState("menu");
  const [loading, setLoading] = useState(false);

  // User Profile Data
  const [profileData, setProfileData] = useState<any>({});

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editAge, setEditAge] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editTransport, setEditTransport] = useState<string[]>([]);

  // History Records
  const [fullHistory, setFullHistory] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const checkUser = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (isActive) {
          setSession(session);
          if (!session) {
            setProfileData({});
            setFullHistory([]);
            setEditAge("");
            setEditArea("");
            setEditPrice("");
            setEditInterests([]);
            setEditTransport([]);
            setCurrentView("menu");
          }
        }
      };
      checkUser();
      return () => {
        isActive = false;
      };
    }, []),
  );

  async function fetchProfile() {
    if (!session?.user) return;
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", session.user.id)
      .single();
    if (data) {
      setProfileData(data);
      setEditAge(data.age_group || "");
      setEditArea(data.area_of_residence || "");
      setEditPrice(data.price_sensitivity || "");
      setEditInterests(data.interests ? data.interests.split(";") : []);
      setEditTransport(
        data.transportation_modes ? data.transportation_modes.split(";") : [],
      );
    }
    setLoading(false);
  }

  async function updateProfile() {
    if (!session?.user) return;
    setLoading(true);
    const { error } = await supabase
      .from("users")
      .update({
        age_group: editAge,
        area_of_residence: editArea,
        price_sensitivity: editPrice,
        interests: editInterests.join(";"),
        transportation_modes: editTransport.join(";"),
      })
      .eq("auth_id", session.user.id);
    setLoading(false);
    if (!error) {
      Alert.alert("Success", "Profile saved successfully");
      setIsEditing(false);
      fetchProfile();
    }
  }

  async function fetchHistory() {
    if (!session?.user) return;
    setLoading(true);
    const { data } = await supabase
      .from("search_history")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    setFullHistory(data || []);
    setLoading(false);
  }

  async function signOut() {
    setSession(null);
    await supabase.auth.signOut();
    Alert.alert("Logged Out", "You are now a guest");
    setCurrentView("menu");
  }

  // Deactivate Account
  const handleDeactivate = () => {
    Alert.alert(
      "⚠ Deactivate Account Warning",
      "After deactivation, your profile will be invisible to others, and you will be forced to log out. Are you sure you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Deactivate",
          style: "destructive",
          onPress: async () => {
            if (!session?.user) return;
            setLoading(true);

            // Mark as inactive
            const { error } = await supabase
              .from("users")
              .update({ is_active: false })
              .eq("auth_id", session.user.id);

            setLoading(false);

            if (error) {
              Alert.alert("Operation Failed", error.message);
            } else {
              Alert.alert("Account Deactivated", "We will miss you. Goodbye!", [
                { text: "OK", onPress: signOut }, // Force logout on success
              ]);
            }
          },
        },
      ],
    );
  };

  const goToLogin = () => {
    router.push("/login" as any);
  };

  const handleMenuClick = (viewName: string) => {
    if (!session) {
      Alert.alert("Guest Mode", "You need to log in to use this feature.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: goToLogin },
      ]);
    } else {
      setCurrentView(viewName);
      if (viewName === "profile") fetchProfile();
      if (viewName === "history") fetchHistory();
    }
  };

  if (currentView === "menu") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarPlaceholder}>
            <Text style={{ fontSize: 30 }}>👤</Text>
          </View>
          <Text style={styles.username}>{session?.user?.email || "Guest"}</Text>
          <Text style={{ color: "#666" }}>
            {session ? "Standard User" : "Not Logged In"}
          </Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuClick("profile")}
          >
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Personal Profile</Text>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuClick("history")}
          >
            <Ionicons name="time-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Search History</Text>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/privacy" as any)}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          {session ? (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={signOut}>
                <Ionicons name="log-out-outline" size={24} color="#666" />
                <Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.menuItem,
                  { marginTop: 20, borderColor: "#ffcccc", borderWidth: 1 },
                ]}
                onPress={handleDeactivate}
              >
                <Ionicons name="close-circle-outline" size={24} color="red" />
                <Text
                  style={[
                    styles.menuText,
                    { color: "red", fontWeight: "bold" },
                  ]}
                >
                  Deactivate Account
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.menuItem} onPress={goToLogin}>
              <Ionicons name="log-in-outline" size={24} color="#007AFF" />
              <Text style={[styles.menuText, { color: "#007AFF" }]}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (currentView === "profile") {
    return (
      <ScrollView contentContainerStyle={styles.subPageContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentView("menu")}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={{ fontSize: 16, marginLeft: 5 }}>Back to Menu</Text>
        </TouchableOpacity>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text style={styles.pageTitle}>Personal Profile</Text>
          <Button
            title={isEditing ? "Cancel" : "Edit"}
            onPress={() => setIsEditing(!isEditing)}
          />
        </View>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <View>
            <CustomDropdown
              label="Age Group"
              value={isEditing ? editAge : profileData.age_group}
              options={AGE_RANGES}
              onSelect={setEditAge}
              readOnly={!isEditing}
            />
            <CustomDropdown
              label="Residential Area"
              value={isEditing ? editArea : profileData.area_of_residence}
              options={SG_AREAS}
              onSelect={setEditArea}
              readOnly={!isEditing}
            />
            <TagSelector
              label="Interests"
              options={INTEREST_TAGS}
              selectedValues={
                isEditing
                  ? editInterests
                  : profileData.interests?.split(";") || []
              }
              onToggle={(t: string) => {
                if (editInterests.includes(t))
                  setEditInterests(editInterests.filter((i) => i !== t));
                else setEditInterests([...editInterests, t]);
              }}
              readOnly={!isEditing}
            />
            <TagSelector
              label="Transport Mode"
              options={TRANSPORT_TAGS}
              selectedValues={
                isEditing
                  ? editTransport
                  : profileData.transportation_modes?.split(";") || []
              }
              onToggle={(t: string) => {
                if (editTransport.includes(t))
                  setEditTransport(editTransport.filter((i) => i !== t));
                else setEditTransport([...editTransport, t]);
              }}
              readOnly={!isEditing}
            />
            <CustomDropdown
              label="Price Sensitivity"
              value={isEditing ? editPrice : profileData.price_sensitivity}
              options={PRICE_LEVELS}
              onSelect={setEditPrice}
              readOnly={!isEditing}
            />
            {isEditing && (
              <Button title="Save Changes" onPress={updateProfile} />
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  if (currentView === "history") {
    return (
      <View style={styles.subPageContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentView("menu")}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={{ fontSize: 16, marginLeft: 5 }}>Back to Menu</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>All Search History</Text>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <ScrollView>
            {fullHistory.map((item, index) => (
              <View
                key={index}
                style={{
                  padding: 15,
                  borderBottomWidth: 1,
                  borderColor: "#eee",
                }}
              >
                <Text style={{ fontSize: 16 }}>{item.search_query}</Text>
                <Text style={{ color: "#999", fontSize: 12 }}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
            ))}
            {fullHistory.length === 0 && (
              <Text style={{ color: "#999", textAlign: "center" }}>
                No records
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  return <View />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "white",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 5,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  username: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  menuContainer: { padding: 20, marginTop: 10 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    elevation: 2,
  },
  menuText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: "500" },
  subPageContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 60, // ✅ Fixed here
    backgroundColor: "#f8f9fa",
  },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
});
