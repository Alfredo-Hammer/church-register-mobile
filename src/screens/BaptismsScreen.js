import { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { baptismsService } from "../services/api";
import { colors } from "../theme";

function formatShortDate(d) {
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

function BaptismRow({ item, onPress }) {
  const initial = (item.first_name?.charAt(0) || "?").toUpperCase();
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{item.first_name} {item.last_name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatShortDate(item.baptism_date)}{item.minister ? ` · ${item.minister}` : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </TouchableOpacity>
  );
}

// Lista de solo lectura — el registro de bautismos (crear/editar) sigue
// siendo cosa de la web. El backend no tiene un `search` por nombre en
// /baptisms (a diferencia de /members), así que el filtro es local sobre
// lo ya cargado en vez de un round-trip por letra tecleada.
export default function BaptismsScreen({ navigation }) {
  const [baptisms, setBaptisms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await baptismsService.getAll({ limit: 200 });
      setBaptisms(data.baptisms || []);
    } catch {
      setBaptisms([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? baptisms.filter((b) =>
        `${b.first_name} ${b.last_name}`.toLowerCase().includes(query) ||
        b.minister?.toLowerCase().includes(query))
    : baptisms;

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o ministro…"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <BaptismRow item={item} onPress={() => navigation.navigate("BaptismDetail", { baptismId: item.id })} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="water-outline" size={22} color={colors.muted} />
              <Text style={styles.emptyText}>Sin bautismos registrados.</Text>
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
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24, marginTop: 12,
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
});
