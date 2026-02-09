import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// --- 📦 1. Static Data Definitions ---

const AGE_GROUPS = [
  "Under 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
];

const SG_DISTRICTS = [
  "Ang Mo Kio",
  "Bedok",
  "Bishan",
  "Bukit Batok",
  "Bukit Merah",
  "Bukit Panjang",
  "Bukit Timah",
  "Central Area",
  "Choa Chu Kang",
  "Clementi",
  "Geylang",
  "Hougang",
  "Jurong East",
  "Jurong West",
  "Kallang",
  "Mandai",
  "Marine Parade",
  "Novena",
  "Pasir Ris",
  "Punggol",
  "Queenstown",
  "Sembawang",
  "Sengkang",
  "Serangoon",
  "Tampines",
  "Toa Payoh",
  "Woodlands",
  "Yishun",
].sort();

const PRICE_LEVELS = ["Low", "Medium", "High"];

const TRANSPORT_MODES = ["MRT", "Bus", "Car", "Taxi/Grab", "Bicycle/Walk"];

// 50+ Interest Tags
const INTEREST_TAGS = [
  "Cafe Hopping",
  "Fine Dining",
  "Hawker Food",
  "Bubble Tea",
  "Desserts",
  "Seafood",
  "Vegetarian",
  "Bars",
  "Movies",
  "Shopping",
  "Hiking",
  "Cycling",
  "Gym",
  "Yoga",
  "Swimming",
  "Bowling",
  "Karaoke",
  "Photography",
  "Tech",
  "Gaming",
  "Reading",
  "Art & Design",
  "Music",
  "Fashion",
  "Beauty",
  "Nightlife",
  "Family Time",
  "Pet Friendly",
  "Date Night",
  "Group Hangout",
];

// --- 🧩 2. Page Component ---

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [ageGroup, setAgeGroup] = useState("");
  const [area, setArea] = useState("");
  const [priceSens, setPriceSens] = useState("");
  const [transports, setTransports] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const [activeModal, setActiveModal] = useState<string | null>(null);

  // --- 🛠️ 3. Logic Handlers ---

  const toggleSelection = (
    item: string,
    list: string[],
    setList: (l: string[]) => void,
  ) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip Profile Setup?",
      "You can always update this later in your profile settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Skip", onPress: () => router.replace("/(tabs)") },
      ],
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // ✅ Key Change: Force use of semicolon (;) separator and convert to lowercase
      const payload = {
        age_group: ageGroup,
        area_of_residence: area,
        price_sensitivity: priceSens.toLowerCase(),

        // Transport: Join with semicolon (mrt;bus)
        transportation_modes: transports.map((t) => t.toLowerCase()).join(";"),

        // Interests: Join with semicolon (movies;tech)
        interests: interests.map((i) => i.toLowerCase()).join(";"),
      };

      const { error } = await supabase
        .from("users")
        .update(payload)
        .eq("auth_id", user.id);

      if (error) throw error;

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 🎨 4. Reusable Modal Component ---
  const renderPickerModal = (
    title: string,
    data: string[],
    selected: string | string[],
    onSelect: (item: string) => void,
    isMulti: boolean = false,
  ) => (
    <Modal
      visible={!!activeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setActiveModal(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={data}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = isMulti
                ? (selected as string[]).includes(item)
                : selected === item;

              return (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    if (!isMulti) setActiveModal(null);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {isMulti && (
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  // --- 📱 5. UI Rendering ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Let's get to know you</Text>
          <Text style={styles.subtitle}>
            Help us personalize your experience
          </Text>
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {/* Age Group */}
        <Text style={styles.label}>Age Group</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setActiveModal("age")}
        >
          <Text style={ageGroup ? styles.value : styles.placeholder}>
            {ageGroup || "Select your age group"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* Area */}
        <Text style={styles.label}>Area of Residence</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setActiveModal("area")}
        >
          <Text style={area ? styles.value : styles.placeholder}>
            {area || "Where do you live?"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* Price */}
        <Text style={styles.label}>Price Preference</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setActiveModal("price")}
        >
          <Text style={priceSens ? styles.value : styles.placeholder}>
            {priceSens || "Select budget range"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* Transport (UI displays with semicolon ; separator) */}
        <Text style={styles.label}>Transport Modes (Select multiple)</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setActiveModal("transport")}
        >
          <Text
            style={transports.length > 0 ? styles.value : styles.placeholder}
            numberOfLines={1}
          >
            {/* ✅ Join with semicolon for display */}
            {transports.length > 0 ? transports.join("; ") : "MRT; Bus; etc."}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* Interests (UI displays with semicolon ; separator) */}
        <Text style={styles.label}>Interests (Select multiple)</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setActiveModal("interest")}
        >
          <Text
            style={interests.length > 0 ? styles.value : styles.placeholder}
            numberOfLines={1}
          >
            {/* ✅ Join with semicolon for display */}
            {interests.length > 0 ? interests.join("; ") : "What do you like?"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* Tags Display (Visual tags for better UX) */}
        {interests.length > 0 && (
          <View style={styles.tagsContainer}>
            {interests.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? "Saving..." : "Start Exploring"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {activeModal === "age" &&
        renderPickerModal(
          "Select Age Group",
          AGE_GROUPS,
          ageGroup,
          setAgeGroup,
        )}
      {activeModal === "area" &&
        renderPickerModal("Select Area", SG_DISTRICTS, area, setArea)}
      {activeModal === "price" &&
        renderPickerModal(
          "Select Price Range",
          PRICE_LEVELS,
          priceSens,
          setPriceSens,
        )}

      {activeModal === "transport" &&
        renderPickerModal(
          "Select Transport",
          TRANSPORT_MODES,
          transports,
          (item) => toggleSelection(item, transports, setTransports),
          true,
        )}

      {activeModal === "interest" &&
        renderPickerModal(
          "Select Interests",
          INTEREST_TAGS,
          interests,
          (item) => toggleSelection(item, interests, setInterests),
          true,
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 20,
    paddingTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#333" },
  subtitle: { fontSize: 16, color: "#666", marginTop: 5 },
  skipBtn: { padding: 5 },
  skipText: { color: "#999", fontSize: 16 },

  form: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  selector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  placeholder: { color: "#aaa", fontSize: 16 },
  value: { color: "#333", fontSize: 16, fontWeight: "500" },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  tag: {
    backgroundColor: "#E6F4FE",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tagText: { color: "#007AFF", fontSize: 12, fontWeight: "600" },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#eee" },
  submitBtn: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  btnDisabled: { backgroundColor: "#A0CFFF" },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  optionItem: {
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  optionSelected: { backgroundColor: "#F0F9FF" },
  optionText: { fontSize: 16, color: "#333" },
  optionTextSelected: { color: "#007AFF", fontWeight: "600" },
  modalDoneBtn: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalDoneText: { color: "#007AFF", fontSize: 18, fontWeight: "bold" },
});
