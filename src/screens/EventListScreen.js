import { useEffect, useState, useCallback } from "react";
import { View, Text, SectionList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { eventsService } from "../services/api";
import { colors, EVENT_TYPE_META } from "../theme";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// Solo eventos pasados admiten tomar asistencia — mismo candado que ya
// aplica el backend en recordAttendance/recordBulkAttendance (rechaza
// eventos futuros con 400). Acá se refleja de entrada en vez de dejar que
// alguien toque un evento futuro y se encuentre con el error después.
export default function EventListScreen({ navigation }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await eventsService.getAll({ limit: 200 });
      const now = new Date();
      const past = [];
      const upcoming = [];
      for (const e of data.events) {
        (new Date(e.date) >= now ? upcoming : past).push(e);
      }
      past.sort((a, b) => new Date(b.date) - new Date(a.date));
      upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
      setSections([
        ...(upcoming.length ? [{ title: "Próximos", data: upcoming, isPast: false }] : []),
        ...(past.length ? [{ title: "Pasados", data: past, isPast: true }] : []),
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
      contentContainerStyle={sections.length === 0 && styles.center}
      sections={sections}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListEmptyComponent={<Text style={styles.empty}>Sin eventos todavía</Text>}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item, section }) => {
        const type = EVENT_TYPE_META[item.event_type] || { label: item.event_type, color: colors.muted };
        return (
          <TouchableOpacity
            style={[styles.card, !section.isPast && styles.cardDisabled]}
            activeOpacity={section.isPast ? 0.7 : 1}
            onPress={() => section.isPast && navigation.navigate("Attendance", { eventId: item.id, eventTitle: item.title })}
          >
            <View style={styles.cardTop}>
              <View style={[styles.typePill, { backgroundColor: type.color + "22" }]}>
                <Text style={[styles.typePillText, { color: type.color }]}>{type.label}</Text>
              </View>
              {section.isPast && <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{formatDate(item.date)}</Text>
            {!section.isPast && <Text style={styles.futureNote}>Asistencia disponible después del evento</Text>}
            {section.isPast && (
              <Text style={styles.cardCount}>
                {item.attendance_count ?? 0} de {item.total_count ?? 0} registrados
              </Text>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { color: colors.muted, fontSize: 14 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  cardDisabled: { opacity: 0.6 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typePill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  typePillText: { fontSize: 11, fontWeight: "700" },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text, marginTop: 8 },
  cardSubtitle: { fontSize: 12, color: colors.muted, marginTop: 3, textTransform: "capitalize" },
  cardCount: { fontSize: 11.5, color: colors.primary, marginTop: 6, fontWeight: "600" },
  futureNote: { fontSize: 11.5, color: colors.muted, marginTop: 6, fontStyle: "italic" },
});
