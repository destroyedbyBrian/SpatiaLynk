// app/(business)/spots.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabase";

type POI = {
  poi_id: string;
  name: string;
  characteristic: string;
  category: string;
  street: string;
  district: string;
  region: string;
  price: string;
  latitude: number | null;
  longitude: number | null;
  images: string[] | null;
  owner_id: string;
  status: string;
};

const DEFAULT_DISTRICTS = [
  "Orchard",
  "Bugis",
  "Chinatown",
  "Little India",
  "Marina Bay",
  "Sentosa",
  "Tiong Bahru",
  "Geylang",
  "Jurong East",
  "Tampines",
];

export default function MySpotsScreen() {
  const [loading, setLoading] = useState(false);
  const [spots, setSpots] = useState<POI[]>([]);

  // District Data
  const [availableDistricts, setAvailableDistricts] =
    useState<string[]>(DEFAULT_DISTRICTS);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // --- Form State ---
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Food");
  const [desc, setDesc] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [region, setRegion] = useState("");

  // Price Range State
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetchMySpots();
    fetchDistricts();
  }, []);

  async function fetchDistricts() {
    const { data } = await supabase.from("pois").select("district");
    if (data && data.length > 0) {
      const uniqueDistricts = Array.from(
        new Set(data.map((item) => item.district).filter((d) => d)),
      );
      const combined = Array.from(
        new Set([...DEFAULT_DISTRICTS, ...uniqueDistricts]),
      ).sort();
      setAvailableDistricts(combined);
    }
  }

  async function fetchMySpots() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("pois")
      .select("*")
      .eq("owner_id", session.user.id);

    if (error) console.error("Fetch error:", error.message);
    else setSpots(data || []);

    setLoading(false);
  }

  // 🔥 Updated: 使用 RPC 调用数据库函数，解决 1000 条限制和权限问题
  async function generateCustomId(nameInput: string) {
    console.log("🔍 Asking DB for max sequence...");

    // 1. 调用我们在 Supabase 写好的函数 'get_max_poi_seq'
    const { data: maxSeq, error } = await supabase.rpc("get_max_poi_seq");

    if (error) {
      console.error("❌ RPC Error:", error.message);
      // 如果出错，用时间戳兜底，防止无法保存
      return `poi_${Date.now()}_${nameInput.replace(/[^a-zA-Z0-9_]/g, "")}`;
    }

    // 2. 如果数据库是空的(返回null)，就从 1000 开始
    const currentMax = maxSeq || 1000;
    const nextSeq = currentMax + 1;

    console.log(`📊 DB says max is: ${currentMax}. New Seq: ${nextSeq}`);

    // 3. 清理店名 (Book Bar -> Book_Bar)
    const cleanName = nameInput
      .trim()
      .replace(/\s+/g, "_") // 空格变下划线
      .replace(/[^a-zA-Z0-9_]/g, ""); // 去掉特殊符号

    // 4. 拼接
    return `poi_${nextSeq}_${cleanName}`;
  }

  // 3. Submit Data
  async function handleSave() {
    if (!name || !desc || !address) {
      Alert.alert("Notice", "Please fill in Name, Description and Address.");
      return;
    }

    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    const imageArray = imageUrl
      ? [imageUrl]
      : ["https://via.placeholder.com/300"];

    let finalPrice = "";
    if (priceMin && priceMax) {
      finalPrice = `$${priceMin} - $${priceMax}`;
    } else if (priceMin) {
      finalPrice = `$${priceMin}+`;
    } else if (priceMax) {
      finalPrice = `Up to $${priceMax}`;
    }

    const payload = {
      name,
      characteristic: desc,
      category,
      street: address,
      district,
      region,
      price: finalPrice,
      latitude: null,
      longitude: null,
      images: imageArray,
      owner_id: session.user.id,
      status: "pending",
      popularity: 0,
    };

    let error;

    if (isEditing && currentId) {
      // Update
      const res = await supabase
        .from("pois")
        .update(payload)
        .eq("poi_id", currentId);
      error = res.error;
    } else {
      // Insert: 🔥 只传入 name 生成 ID
      const customId = await generateCustomId(name);

      const insertPayload = { ...payload, poi_id: customId };
      const res = await supabase.from("pois").insert(insertPayload);
      error = res.error;
    }

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", isEditing ? "Shop Updated" : "Shop Created");
      closeModal();
      fetchMySpots();
      fetchDistricts();
    }
    setLoading(false);
  }

  // 4. Delete Data
  function confirmDelete(id: string) {
    Alert.alert("Confirm Delete", "Cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const { error } = await supabase
            .from("pois")
            .delete()
            .eq("poi_id", id);
          setLoading(false);
          if (error) Alert.alert("Error", error.message);
          else fetchMySpots();
        },
      },
    ]);
  }

  // UI Helpers
  function openModal(spot?: POI) {
    if (spot) {
      setIsEditing(true);
      setCurrentId(spot.poi_id);
      setName(spot.name);
      setDesc(spot.characteristic || "");
      setCategory(spot.category || "Food");
      setAddress(spot.street || "");
      setDistrict(spot.district || "");
      setRegion(spot.region || "");

      const priceParts = spot.price
        ? spot.price.replace(/\$/g, "").split("-")
        : [];
      setPriceMin(priceParts[0] ? priceParts[0].trim() : "");
      setPriceMax(priceParts[1] ? priceParts[1].trim() : "");

      setImageUrl(spot.images && spot.images.length > 0 ? spot.images[0] : "");
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setName("");
      setDesc("");
      setCategory("Food");
      setAddress("");
      setDistrict("");
      setRegion("");
      setPriceMin("");
      setPriceMax("");
      setImageUrl("");
    }
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setShowDistrictPicker(false);
  }

  const renderItem = ({ item }: { item: POI }) => {
    const displayImage =
      item.images && item.images.length > 0
        ? item.images[0]
        : "https://via.placeholder.com/150";

    return (
      <View style={styles.card}>
        <Image source={{ uri: displayImage }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={styles.cardCategory}>🏷️ {item.category}</Text>
            <Text style={{ fontSize: 12, color: "#666" }}>
              {item.district ? `📍 ${item.district}` : ""}
            </Text>
          </View>

          <Text style={styles.cardText} numberOfLines={1}>
            {item.street || "No Address"}
          </Text>

          <Text style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>
            {item.price ? `Price: ${item.price}` : "Price: N/A"}
          </Text>

          {/* Debug: 显示生成的 ID */}
          <Text style={{ fontSize: 10, color: "#ccc", marginBottom: 5 }}>
            ID: {item.poi_id}
          </Text>

          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.characteristic}
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => openModal(item)}
            >
              <Ionicons name="create-outline" size={16} color="white" />
              <Text style={styles.btnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => confirmDelete(item.poi_id)}
            >
              <Ionicons name="trash-outline" size={16} color="white" />
              <Text style={styles.btnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Shops Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading && spots.length === 0 ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={spots}
          keyExtractor={(item) => item.poi_id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No shops yet. Click "+" to add one.
            </Text>
          }
        />
      )}

      {/* Main Edit/Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? "Edit Shop" : "Add New Shop"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Shop Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Book Bar"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {["Food", "Retail", "Service", "Fun"].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      category === cat && styles.catChipActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catText,
                        category === cat && styles.catTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Street Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 123 Orchard Road"
                value={address}
                onChangeText={setAddress}
              />

              {/* District Dropdown */}
              <Text style={styles.label}>District</Text>
              <TouchableOpacity
                style={[styles.input, { justifyContent: "center" }]}
                onPress={() => setShowDistrictPicker(true)}
              >
                <Text style={{ color: district ? "#000" : "#999" }}>
                  {district || "Select District"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color="#999"
                  style={{ position: "absolute", right: 10 }}
                />
              </TouchableOpacity>

              <Text style={styles.label}>Region</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Central"
                value={region}
                onChangeText={setRegion}
              />

              {/* Price Range */}
              <Text style={styles.label}>Price Range ($)</Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Min (e.g. 10)"
                    keyboardType="numeric"
                    value={priceMin}
                    onChangeText={setPriceMin}
                  />
                </View>
                <Text>-</Text>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Max (e.g. 50)"
                    keyboardType="numeric"
                    value={priceMax}
                    onChangeText={setPriceMax}
                  />
                </View>
              </View>

              <Text style={styles.label}>Image URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                value={imageUrl}
                onChangeText={setImageUrl}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Description / Characteristic *</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                placeholder="Describe your shop..."
                value={desc}
                onChangeText={setDesc}
                multiline
              />

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={{ color: "#666" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {loading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictPicker}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "60%" }]}>
            <Text style={styles.modalTitle}>Select District</Text>
            <ScrollView>
              {availableDistricts.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.pickerItem}
                  onPress={() => {
                    setDistrict(item);
                    setShowDistrictPicker(false);
                  }}
                >
                  <Text style={styles.pickerText}>{item}</Text>
                  {district === item && (
                    <Ionicons name="checkmark" size={20} color="#6200ea" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowDistrictPicker(false)}
            >
              <Text
                style={{ color: "red", textAlign: "center", marginTop: 10 }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    backgroundColor: "white",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  addBtn: {
    backgroundColor: "#6200ea",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { textAlign: "center", color: "#999", marginTop: 50 },

  // Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 2,
  },
  cardImage: { width: "100%", height: 150 },
  cardContent: { padding: 15 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  cardCategory: {
    fontSize: 12,
    color: "#6200ea",
    marginBottom: 5,
    fontWeight: "bold",
  },
  cardText: { fontSize: 13, color: "#333", marginBottom: 5 },
  cardDesc: { fontSize: 14, color: "#666", marginBottom: 15, lineHeight: 20 },
  actionRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  actionBtn: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  editBtn: { backgroundColor: "#007AFF" },
  deleteBtn: { backgroundColor: "#ff4444" },
  btnText: { color: "white", marginLeft: 5, fontSize: 12, fontWeight: "bold" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    maxHeight: "85%",
    width: "90%",
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fcfcfc",
    minHeight: 45,
  },
  categoryRow: { flexDirection: "row", gap: 8, marginTop: 5 },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  catChipActive: { backgroundColor: "#6200ea" },
  catText: { fontSize: 12, color: "#333" },
  catTextActive: { color: "white", fontWeight: "bold" },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 15,
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 15,
  },
  cancelBtn: { padding: 10 },
  saveBtn: {
    backgroundColor: "#6200ea",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  pickerItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerText: { fontSize: 16, color: "#333" },
});
