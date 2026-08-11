import { useCallback, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  FlatList, ActivityIndicator, RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { publicService } from "../services/api";
import { colors, EVENT_TYPE_META, DAY_NAMES } from "../theme";

function formatEventDate(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

// Una conferencia dura varios días — mostrar el rango completo en vez de
// una sola fecha/hora, que solo tendría sentido para un evento puntual.
function formatDateRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startLabel = start.toLocaleDateString("es", { day: "numeric", month: "long" });
  const endLabel = end.toLocaleDateString("es", { day: "numeric", month: "long" });
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

// "HH:MM:SS" tal como lo devuelve Postgres para una columna TIME — se arma
// una fecha cualquiera solo para reusar el formateador de hora del sistema.
function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const d = new Date(2000, 0, 1, Number(h), Number(m));
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function PrayerDayRow({ item }) {
  return (
    <View style={styles.prayerRow}>
      <View style={styles.prayerDayPill}>
        <Text style={styles.prayerDayPillText}>{DAY_NAMES[item.day_of_week].slice(0, 3)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.prayerName}>{item.name}</Text>
        <Text style={styles.prayerMeta}>
          {DAY_NAMES[item.day_of_week]} · {formatTime(item.start_time)}
          {item.end_time ? ` – ${formatTime(item.end_time)}` : ""}
          {item.location ? ` · ${item.location}` : ""}
        </Text>
      </View>
    </View>
  );
}

function EventCard({ item }) {
  const meta = EVENT_TYPE_META[item.event_type] || { label: item.event_type, color: colors.primary };
  const isConference = item.kind === "conference";
  return (
    <View style={styles.eventCard}>
      <View style={[styles.eventDot, { backgroundColor: meta.color }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.eventHeaderRow}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.eventBadge, { backgroundColor: `${meta.color}22` }]}>
            <Text style={[styles.eventBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <Text style={styles.eventDate}>
          {isConference ? formatDateRange(item.date, item.end_date) : formatEventDate(item.date)}
        </Text>
        {isConference && item.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.muted} />
            <Text style={styles.eventLocation}>{item.location}</Text>
          </View>
        ) : null}
        {item.description ? (
          <Text style={styles.eventDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
    </View>
  );
}

// Primer bloque real del dashboard de miembro: próximos eventos de su
// iglesia, vía el endpoint público scoped por church_id (todavía no hay
// sesión de miembro, solo la asociación dispositivo↔iglesia del código de
// invitación). El resto (grupos, oración, historial personal) queda para
// fases siguientes.
export default function MemberHomeScreen() {
  const { joinedChurch, leaveChurch } = useAuth();
  const [events, setEvents] = useState([]);
  const [prayerDays, setPrayerDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (!joinedChurch?.id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const [eventsData, prayerData] = await Promise.all([
        publicService.getUpcomingEvents(joinedChurch.id),
        publicService.getPrayerDays(joinedChurch.id),
      ]);
      setEvents(eventsData.events || []);
      setPrayerDays(prayerData.prayerDays || []);
    } catch {
      setError("No se pudo cargar la información. Desliza para intentar de nuevo.");
    }
    setLoading(false);
    setRefreshing(false);
  }, [joinedChurch?.id]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={events}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <EventCard item={item} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          {joinedChurch?.logoUrl ? (
            <Image source={{ uri: joinedChurch.logoUrl }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="home" size={28} color={colors.muted} />
            </View>
          )}
          <Text style={styles.churchName}>{joinedChurch?.name}</Text>

          {prayerDays.length > 0 && (
            <View style={styles.prayerSection}>
              <Text style={styles.sectionLabel}>Días de oración</Text>
              {prayerDays.map((pd) => <PrayerDayRow key={pd.id} item={pd} />)}
            </View>
          )}

          <Text style={styles.sectionLabel}>Próximos eventos</Text>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={22} color={colors.muted} />
            <Text style={styles.emptyText}>
              {error || "Todavía no hay eventos próximos publicados."}
            </Text>
          </View>
        )
      }
      ListFooterComponent={
        <TouchableOpacity style={styles.leaveButton} onPress={leaveChurch}>
          <Text style={styles.leaveButtonText}>No es mi iglesia — salir</Text>
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  header: { alignItems: "center", marginBottom: 20 },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: 12 },
  logoPlaceholder: {
    width: 72, height: 72, borderRadius: 18, marginBottom: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  churchName: { fontSize: 19, fontWeight: "800", color: colors.text, textAlign: "center" },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: colors.muted, marginTop: 24, alignSelf: "flex-start" },
  prayerSection: { width: "100%" },
  prayerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 12, marginTop: 10,
  },
  prayerDayPill: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.cardAlt, alignItems: "center", justifyContent: "center",
  },
  prayerDayPillText: { fontSize: 11, fontWeight: "800", color: colors.primary, textTransform: "uppercase" },
  prayerName: { fontSize: 14, fontWeight: "700", color: colors.text },
  prayerMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  eventCard: {
    flexDirection: "row", gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 14, marginTop: 12,
  },
  eventDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  eventHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  eventTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  eventBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  eventBadgeText: { fontSize: 10.5, fontWeight: "700" },
  eventDate: { fontSize: 12.5, color: colors.muted, marginTop: 4, textTransform: "capitalize" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  eventLocation: { fontSize: 12, color: colors.muted },
  eventDescription: { fontSize: 12.5, color: colors.muted, marginTop: 6 },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24, marginTop: 12,
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
  leaveButtonText: { color: colors.danger, fontSize: 13, fontWeight: "600" },
  leaveButton: { marginTop: 32, alignSelf: "center", padding: 8 },
});
