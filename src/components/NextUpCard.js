import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, EVENT_TYPE_META, DAY_NAMES } from "../theme";
import { formatEventDate, formatDateRange, formatTime } from "../utils/schedule";

// Tarjeta "Próximo" — evento, conferencia u ocurrencia de oración más
// cercana. Compartida entre el home de miembro y el de staff (antes vivía
// solo en MemberHomeScreen; el staff no tenía forma de ver esto en su
// propio dashboard).
export default function NextUpCard({ item }) {
  if (!item) return null;
  const meta = EVENT_TYPE_META[item.event_type] || { label: "Oración", color: colors.primary };
  const isPrayer = item.kind === "prayer";
  return (
    <View style={styles.nextCard}>
      <View style={styles.nextCardHeader}>
        <View style={styles.nextBadgeRow}>
          <Ionicons name="sparkles" size={13} color={colors.primary} />
          <Text style={styles.nextLabel}>Próximo</Text>
        </View>
        <View style={[styles.eventBadge, { backgroundColor: `${meta.color}22` }]}>
          <Text style={[styles.eventBadgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      <Text style={styles.nextTitle} numberOfLines={2}>{item.title}</Text>
      <View style={styles.metaLineRow}>
        <Ionicons name="time-outline" size={13} color={colors.muted} />
        <Text style={styles.nextMeta}>
          {isPrayer
            ? `${DAY_NAMES[item.day_of_week]} · ${formatTime(item.start_time)}`
            : item.kind === "conference"
              ? formatDateRange(item.date, item.end_date)
              : formatEventDate(item.date)}
        </Text>
      </View>
      {item.location ? (
        <View style={styles.metaLineRow}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={styles.nextMeta}>{item.location}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  nextCard: {
    backgroundColor: `${colors.primary}17`,
    borderWidth: 1, borderColor: `${colors.primary}55`,
    borderRadius: 16, padding: 16,
  },
  nextCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nextBadgeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  nextLabel: { fontSize: 11, fontWeight: "800", color: colors.primary, textTransform: "uppercase", letterSpacing: 0.5 },
  eventBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  eventBadgeText: { fontSize: 10.5, fontWeight: "700" },
  nextTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginTop: 10 },
  metaLineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  nextMeta: { fontSize: 12.5, color: colors.muted, textTransform: "capitalize" },
});
