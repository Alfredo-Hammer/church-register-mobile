import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { publicService } from "../services/api";
import { colors, EVENT_TYPE_META, DAY_NAMES } from "../theme";
import { formatDateRange, formatTime, isEventLiveNow } from "../utils/schedule";

const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DOW_SHORT = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

function groupEventsByMonth(events) {
  const groups = [];
  let currentKey = null;
  for (const e of events) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key !== currentKey) {
      groups.push({ year: d.getFullYear(), month: d.getMonth(), items: [] });
      currentKey = key;
    }
    groups[groups.length - 1].items.push(e);
  }
  return groups;
}

function EventRow({ item, onPress }) {
  const d = new Date(item.date);
  const meta = EVENT_TYPE_META[item.event_type] || { label: item.event_type, color: colors.primary };
  const isConference = item.kind === "conference";
  const isLive = isEventLiveNow(item);
  const Wrapper = isConference && item.public_token ? TouchableOpacity : View;
  return (
    <Wrapper
      style={styles.eventRow}
      {...(isConference && item.public_token ? { activeOpacity: 0.7, onPress } : {})}
    >
      <View style={[styles.dateBadge, isLive && { backgroundColor: colors.danger }]}>
        <Text style={styles.dateBadgeDow}>{DOW_SHORT[d.getDay()]}</Text>
        <Text style={styles.dateBadgeNum}>{d.getDate()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.eventMeta} numberOfLines={1}>
          {isConference ? formatDateRange(item.date, item.end_date) : formatTime(d.toTimeString().slice(0, 5))}
          {item.location ? ` · ${item.location}` : ""}
        </Text>
      </View>
      {isLive ? (
        <View style={styles.liveTag}>
          <View style={styles.liveTagDot} />
          <Text style={styles.liveTagText}>EN VIVO</Text>
        </View>
      ) : (
        <View style={[styles.typeBadge, { backgroundColor: `${meta.color}22` }]}>
          <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      )}
    </Wrapper>
  );
}

function PrayerDayRow({ item }) {
  return (
    <View style={styles.prayerRow}>
      <View style={styles.prayerDayPill}>
        <Text style={styles.prayerDayPillText}>{DAY_NAMES[item.day_of_week].slice(0, 3)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle}>{item.name}</Text>
        <Text style={styles.eventMeta}>
          {formatTime(item.start_time)}
          {item.end_time ? ` – ${formatTime(item.end_time)}` : ""}
          {item.location ? ` · ${item.location}` : ""}
        </Text>
      </View>
    </View>
  );
}

// Pestaña "Calendario" del home de miembro — separa lo que en el Inicio
// original era una sola lista larga (oración + eventos mezclados) en su
// propia pantalla, agrupada por mes como en apps de iglesia de referencia
// (Church Center). Reusa los mismos endpoints públicos que ya usaba Inicio.
export default function MemberCalendarScreen({ navigation }) {
  const { joinedChurch } = useAuth();
  const [events, setEvents] = useState([]);
  const [prayerDays, setPrayerDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!joinedChurch?.id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [eventsData, prayerData] = await Promise.all([
        publicService.getUpcomingEvents(joinedChurch.id),
        publicService.getPrayerDays(joinedChurch.id),
      ]);
      setEvents(eventsData.events || []);
      setPrayerDays(prayerData.prayerDays || []);
    } catch { /* silencioso */ }
    setLoading(false);
    setRefreshing(false);
  }, [joinedChurch?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const monthGroups = groupEventsByMonth(events);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
    >
      {prayerDays.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Días de oración</Text>
          {prayerDays.map((pd) => <PrayerDayRow key={pd.id} item={pd} />)}
        </View>
      )}

      {monthGroups.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={22} color={colors.muted} />
          <Text style={styles.emptyText}>Todavía no hay eventos próximos publicados.</Text>
        </View>
      ) : (
        monthGroups.map(({ year, month, items }) => (
          <View key={`${year}-${month}`} style={styles.section}>
            <Text style={styles.monthLabel}>{MONTH_NAMES[month]} de {year}</Text>
            {items.map((e) => (
              <EventRow
                key={e.id}
                item={e}
                onPress={() => navigation.navigate("ConferenceProgram", { token: e.public_token, title: e.title })}
              />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 22 },
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: colors.muted,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
  },
  monthLabel: {
    fontSize: 13, fontWeight: "800", color: colors.text,
    textTransform: "capitalize", marginBottom: 10,
  },
  eventRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 12, marginBottom: 8,
  },
  dateBadge: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: colors.cardAlt,
    alignItems: "center", justifyContent: "center",
  },
  dateBadgeDow: { fontSize: 9, fontWeight: "800", color: colors.primary, textTransform: "uppercase" },
  dateBadgeNum: { fontSize: 15, fontWeight: "800", color: colors.text, lineHeight: 18 },
  eventTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  eventMeta: { fontSize: 12, color: colors.muted, marginTop: 2, textTransform: "capitalize" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  typeBadgeText: { fontSize: 10, fontWeight: "700" },
  liveTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.danger, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  liveTagDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" },
  liveTagText: { fontSize: 9.5, fontWeight: "800", color: "#fff", letterSpacing: 0.4 },
  prayerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 12, marginBottom: 8,
  },
  prayerDayPill: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.cardAlt, alignItems: "center", justifyContent: "center",
  },
  prayerDayPillText: { fontSize: 11, fontWeight: "800", color: colors.primary, textTransform: "uppercase" },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24,
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
});
