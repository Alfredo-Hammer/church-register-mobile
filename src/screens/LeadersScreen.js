import { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { leadersService } from "../services/api";
import { colors } from "../theme";

const STATUS_COLOR = { ACTIVO: colors.success, INACTIVO: colors.danger };

function LeaderRow({ item, onPress }) {
  const statusColor = STATUS_COLOR[item.status] || colors.muted;
  const initial = (item.firstName?.charAt(0) || "?").toUpperCase();
  const subtitle = [item.position, item.groupName].filter(Boolean).join(" · ");
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{item.firstName} {item.lastName}</Text>
        {subtitle ? <Text style={styles.meta} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
        <Text style={[styles.statusPillText, { color: statusColor }]}>
          {item.status === "ACTIVO" ? "Activo" : "Inactivo"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </TouchableOpacity>
  );
}

// Mismo patrón que MembersScreen: búsqueda server-side con debounce
// (/leaders sí soporta `search`, a diferencia de /baptisms).
export default function LeadersScreen({ navigation }) {
  const [leaders, setLeaders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query) => {
    setLoading(true);
    try {
      const data = await leadersService.getAll({ search: query || undefined });
      setLeaders(data.leaders || []);
    } catch {
      setLeaders([]);
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
          placeholder="Buscar por nombre o cargo…"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={leaders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <LeaderRow item={item} onPress={() => navigation.navigate("LeaderDetail", { leaderId: item.id })} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="ribbon-outline" size={22} color={colors.muted} />
              <Text style={styles.emptyText}>Sin líderes registrados.</Text>
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
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.cardAlt, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusPillText: { fontSize: 10.5, fontWeight: "700" },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24, marginTop: 12,
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
});
