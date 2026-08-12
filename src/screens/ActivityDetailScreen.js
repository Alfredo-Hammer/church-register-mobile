import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { activitiesService } from "../services/api";
import { colors, ACTIVITY_CATEGORY_META, ACTIVITY_STATUS_META } from "../theme";

function formatLongDate(d) {
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function InfoRow({ icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.muted} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// Vista de solo lectura, mismo criterio que el resto de módulos nuevos:
// crear/editar (y cambiar de estado) sigue siendo cosa de la web.
export default function ActivityDetailScreen({ route }) {
  const { activityId } = route.params;
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await activitiesService.getById(activityId);
        setActivity(data.activity);
      } catch {
        setError("No se pudo cargar la actividad.");
      }
      setLoading(false);
    })();
  }, [activityId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !activity) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={22} color={colors.muted} />
        <Text style={styles.emptyText}>{error || "Actividad no encontrada."}</Text>
      </View>
    );
  }

  const category = ACTIVITY_CATEGORY_META[activity.category] || ACTIVITY_CATEGORY_META.OTRO;
  const status = ACTIVITY_STATUS_META[activity.status] || ACTIVITY_STATUS_META.PLANIFICADA;
  const countLine = [
    activity.expected_count != null ? `${activity.expected_count} esperados` : null,
    activity.actual_count != null ? `${activity.actual_count} reales` : null,
  ].filter(Boolean).join(" · ");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.categoryPill, { backgroundColor: `${category.color}22` }]}>
          <Text style={[styles.categoryPillText, { color: category.color }]}>{category.label}</Text>
        </View>
        <Text style={styles.title}>{activity.title}</Text>
        <View style={[styles.statusPill, { backgroundColor: `${status.color}22` }]}>
          <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {activity.description ? (
        <Text style={styles.description}>{activity.description}</Text>
      ) : null}

      <View style={styles.card}>
        <InfoRow icon="calendar-outline" label="Fecha" value={formatLongDate(activity.date)} />
        <InfoRow icon="location-outline" label="Lugar" value={activity.location} />
        <InfoRow icon="person-outline" label="Responsable" value={activity.responsible} />
        <InfoRow icon="people-outline" label="Organiza" value={activity.organizer} />
        <InfoRow icon="stats-chart-outline" label="Participantes" value={countLine || null} />
      </View>

      {activity.notes ? (
        <View style={styles.notesCard}>
          <View style={styles.metaLineRow}>
            <Ionicons name="document-text-outline" size={14} color={colors.primary} />
            <Text style={styles.notesLabel}>Notas</Text>
          </View>
          <Text style={styles.notesText}>{activity.notes}</Text>
        </View>
      ) : null}

      {activity.outcome ? (
        <View style={styles.notesCard}>
          <View style={styles.metaLineRow}>
            <Ionicons name="checkmark-done-outline" size={14} color={colors.primary} />
            <Text style={styles.notesLabel}>Resultado</Text>
          </View>
          <Text style={styles.notesText}>{activity.outcome}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.background },
  header: { alignItems: "center", marginBottom: 16, gap: 8 },
  categoryPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  categoryPillText: { fontSize: 11, fontWeight: "700" },
  title: { fontSize: 19, fontWeight: "800", color: colors.text, textAlign: "center" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusPillText: { fontSize: 11.5, fontWeight: "700" },
  description: { fontSize: 13.5, color: colors.muted, lineHeight: 20, marginBottom: 16, textAlign: "center" },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 16, gap: 14,
  },
  infoRow: { flexDirection: "row", gap: 10 },
  infoLabel: { fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, color: colors.text, marginTop: 2 },
  metaLineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notesCard: {
    backgroundColor: `${colors.primary}14`, borderWidth: 1, borderColor: `${colors.primary}40`,
    borderRadius: 14, padding: 16, marginTop: 14,
  },
  notesLabel: { fontSize: 12.5, fontWeight: "700", color: colors.primary },
  notesText: { fontSize: 13.5, color: colors.text, marginTop: 8, lineHeight: 20 },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: "center" },
});
