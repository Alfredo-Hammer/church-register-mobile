import { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { visitorsService } from "../services/api";
import { colors, VISITOR_STAGE_META } from "../theme";

function VisitorRow({ item, onPress }) {
  const stage = VISITOR_STAGE_META[item.stage] || { label: item.stage, color: colors.muted };
  const initial = (item.first_name?.charAt(0) || "?").toUpperCase();
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{item.first_name} {item.last_name}</Text>
        {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}
      </View>
      <View style={[styles.stagePill, { backgroundColor: `${stage.color}22` }]}>
        <Text style={[styles.stagePillText, { color: stage.color }]}>{stage.label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </TouchableOpacity>
  );
}

export default function VisitorsScreen({ navigation }) {
  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query) => {
    setLoading(true);
    try {
      const data = await visitorsService.getAll({ search: query || undefined, limit: 100 });
      setVisitors(data.visitors || []);
    } catch {
      setVisitors([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 300);
    return () => clearTimeout(timeout);
  }, [search, load]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre…"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <VisitorRow item={item} onPress={() => navigation.navigate("VisitorDetail", { visitorId: item.id })} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="person-add-outline" size={22} color={colors.muted} />
              <Text style={styles.emptyText}>Sin resultados.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  listContent: { paddingBottom: 24 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 10, marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.cardAlt, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  phone: { fontSize: 12, color: colors.muted, marginTop: 2 },
  stagePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  stagePillText: { fontSize: 10, fontWeight: "700" },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24, marginTop: 12,
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
});
