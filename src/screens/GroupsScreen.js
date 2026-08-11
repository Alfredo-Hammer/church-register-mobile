import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { publicService } from "../services/api";
import { colors } from "../theme";

function GroupCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="people" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.leader_name ? (
            <Text style={styles.cardLeader}>Líder: {item.leader_name}</Text>
          ) : null}
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{item.member_count}</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={styles.cardDescription}>{item.description}</Text>
      ) : null}
    </View>
  );
}

// Directorio público de grupos/ministerios: nombre, líder actual y cantidad
// de miembros, vía el mismo patrón público scoped por church_id que el
// resto del dashboard de miembro.
export default function GroupsScreen() {
  const { joinedChurch } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (!joinedChurch?.id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const data = await publicService.getGroups(joinedChurch.id);
      setGroups(data.groups || []);
    } catch {
      setError("No se pudieron cargar los grupos. Desliza para intentar de nuevo.");
    }
    setLoading(false);
    setRefreshing(false);
  }, [joinedChurch?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={groups}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <GroupCard item={item} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={22} color={colors.muted} />
            <Text style={styles.emptyText}>
              {error || "Todavía no hay grupos publicados."}
            </Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 14, marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: `${colors.primary}22`,
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  cardLeader: { fontSize: 12, color: colors.muted, marginTop: 2 },
  countPill: {
    minWidth: 28, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: colors.cardAlt, alignItems: "center",
  },
  countPillText: { fontSize: 12, fontWeight: "700", color: colors.text },
  cardDescription: { fontSize: 12.5, color: colors.muted, marginTop: 10 },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24, marginTop: 12,
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
});
