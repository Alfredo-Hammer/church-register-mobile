import { useEffect, useState, useCallback } from "react";
import { View, Text, SectionList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { activitiesService } from "../services/api";
import { colors, ACTIVITY_CATEGORY_META, ACTIVITY_STATUS_META } from "../theme";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// Mismo criterio que EventListScreen: separa próximas/pasadas por fecha en
// vez de confiar solo en `status`, porque una actividad puede quedarse en
// PLANIFICADA aunque su fecha ya haya pasado si nadie la actualizó.
export default function ActivitiesScreen({ navigation }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await activitiesService.getAll({ limit: 200 });
      const now = new Date();
      const past = [];
      const upcoming = [];
      for (const a of data.activities) {
        (new Date(a.date) >= now ? upcoming : past).push(a);
      }
      past.sort((a, b) => new Date(b.date) - new Date(a.date));
      upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
      setSections([
        ...(upcoming.length ? [{ title: "Próximas", data: upcoming }] : []),
        ...(past.length ? [{ title: "Pasadas", data: past }] : []),
      ]);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { load().then(() => setLoading(false)); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={[styles.listContent, sections.length === 0 && styles.center]}
      sections={sections}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
      renderItem={({ item }) => {
        const category = ACTIVITY_CATEGORY_META[item.category] || ACTIVITY_CATEGORY_META.OTRO;
        const status = ACTIVITY_STATUS_META[item.status] || ACTIVITY_STATUS_META.PLANIFICADA;
        return (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("ActivityDetail", { activityId: item.id })}
          >
            <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {formatDate(item.date)}{item.location ? ` · ${item.location}` : ""}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: `${status.color}22` }]}>
              <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Ionicons name="flag-outline" size={22} color={colors.muted} />
          <Text style={styles.emptyText}>Sin actividades registradas.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 16, paddingBottom: 24 },
  center: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  sectionTitle: {
    fontSize: 12, fontWeight: "700", color: colors.muted,
    textTransform: "uppercase", letterSpacing: 0.5,
    marginTop: 12, marginBottom: 8,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 14, fontWeight: "700", color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusPillText: { fontSize: 10.5, fontWeight: "700" },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24,
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
});
