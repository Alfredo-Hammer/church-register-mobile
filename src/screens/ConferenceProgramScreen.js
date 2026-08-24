import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { publicService } from "../services/api";
import { colors } from "../theme";

const TYPE_COLORS = {
  blue: "#60a5fa", violet: "#a78bfa", amber: "#fbbf24", emerald: "#34d399",
  rose: "#fb7185", cyan: "#22d3ee", orange: "#fb923c", slate: "#94a3b8",
};

const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const toMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function estadoDeSesion(s, index, sessions, isToday, ahoraMin) {
  if (s.status === "CANCELADA") return "cancelada";
  if (s.status === "EN_CURSO") return "encurso";
  if (s.status === "FINALIZADA") return "pasada";
  if (!isToday || s.timeStart === null) return "futura";
  const ini = toMinutes(s.timeStart);
  const fin = toMinutes(s.timeEnd) ?? toMinutes(sessions[index + 1]?.timeStart) ?? ini + 90;
  if (ahoraMin >= fin) return "pasada";
  if (ahoraMin >= ini) return "encurso";
  return "futura";
}

function SessionRow({ session, estado, esSiguiente }) {
  const activa = estado === "encurso";
  const pasada = estado === "pasada";
  const cancelada = estado === "cancelada";
  const accent = cancelada ? colors.danger : activa ? colors.primary : (TYPE_COLORS[session.type?.color] || TYPE_COLORS.slate);

  return (
    <View style={[styles.sessionCard, activa && styles.sessionCardActive, (pasada || cancelada) && styles.sessionCardDim]}>
      <View style={[styles.sessionBar, { backgroundColor: accent }]} />
      <View style={styles.sessionTime}>
        <Text style={[styles.sessionTimeText, activa && { color: colors.primary }]}>{session.timeStart || "—"}</Text>
        {session.timeEnd && <Text style={styles.sessionTimeEnd}>a {session.timeEnd}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.sessionBadgeRow}>
          {session.type?.label && (
            <View style={[styles.badge, activa && { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, activa && { color: "#fff" }]}>{session.type.label}</Text>
            </View>
          )}
          {activa && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: "#fff" }]}>EN CURSO</Text>
            </View>
          )}
          {cancelada && (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text style={[styles.badgeText, { color: "#fff" }]}>CANCELADO</Text>
            </View>
          )}
          {esSiguiente && !cancelada && (
            <View style={styles.badgeOutline}>
              <Ionicons name="time-outline" size={11} color={colors.muted} />
              <Text style={styles.badgeOutlineText}>A CONTINUACIÓN</Text>
            </View>
          )}
        </View>
        <Text style={[styles.sessionTitle, cancelada && styles.sessionTitleCancelled]} numberOfLines={2}>
          {session.title}
        </Text>
        {(session.speaker || session.scriptureRef) && (
          <View style={styles.sessionMetaRow}>
            {session.speaker && (
              <View style={styles.sessionMetaItem}>
                <Ionicons name="person-outline" size={12} color={colors.muted} />
                <Text style={styles.sessionMetaText} numberOfLines={1}>{session.speaker}</Text>
              </View>
            )}
            {session.scriptureRef && (
              <View style={styles.sessionMetaItem}>
                <Ionicons name="book-outline" size={12} color={colors.muted} />
                <Text style={styles.sessionMetaText} numberOfLines={1}>{session.scriptureRef}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// Programa de una conferencia para un invitado sin cuenta — mismo endpoint
// público que la pantalla del salón (/pantalla/:token en la web), pero
// mostrado dentro de la app en vez de exigir abrir el link en un navegador.
// A propósito solo lectura: nada de check-in ni gafetes, eso sigue siendo
// exclusivo del flujo de staff (ConferenceList → SessionPicker → Scanner).
export default function ConferenceProgramScreen({ route, navigation }) {
  const { token, title } = route.params;
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: title || "Programa" });
  }, [title, navigation]);

  const load = useCallback(async (date, isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const d = await publicService.getConferenceProgram(token, date);
      setData(d);
      if (!date && d.day) setSelectedDate(d.day.date);
    } catch { /* silencioso */ }
    setLoading(false);
    setRefreshing(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const ahoraMin = useMemo(() => {
    if (!data?.serverTime) return 0;
    const d = new Date(data.serverTime);
    return d.getHours() * 60 + d.getMinutes();
  }, [data?.serverTime]);

  const sesiones = useMemo(() => {
    if (!data?.sessions?.length) return [];
    const isToday = !!data.day?.isToday;
    return data.sessions.map((s, i) => ({
      ...s,
      estado: estadoDeSesion(s, i, data.sessions, isToday, ahoraMin),
    }));
  }, [data, ahoraMin]);

  const proxima = useMemo(() => {
    const marcada = sesiones.find((s) => s.status === "A_CONTINUACION");
    return marcada || sesiones.find((s) => s.estado === "futura");
  }, [sesiones]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No se pudo cargar el programa.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(selectedDate, true)} tintColor={colors.primary} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.confName} numberOfLines={2}>{data.conference.name}</Text>
        {(data.conference.theme || data.conference.themeVerse) && (
          <Text style={styles.confTheme} numberOfLines={1}>
            {[data.conference.theme, data.conference.themeVerse].filter(Boolean).join(" · ")}
          </Text>
        )}
        {data.conference.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.muted} />
            <Text style={styles.locationText}>{data.conference.location}</Text>
          </View>
        )}
      </View>

      {data.days?.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPickerRow} contentContainerStyle={{ gap: 8 }}>
          {data.days.map((d) => {
            const dt = new Date(d.date + "T12:00:00");
            const selected = d.date === selectedDate;
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.dayPill, selected && styles.dayPillActive]}
                onPress={() => { setSelectedDate(d.date); load(d.date); }}
              >
                <Text style={[styles.dayPillText, selected && styles.dayPillTextActive]}>
                  Día {d.dayNumber} · {dt.getDate()} {MONTH_SHORT[dt.getMonth()]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {sesiones.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={22} color={colors.muted} />
          <Text style={styles.empty}>No hay programa para este día.</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {sesiones.map((s) => (
            <SessionRow key={s.id} session={s} estado={s.estado} esSiguiente={s.id === proxima?.id} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 14, marginBottom: 12,
  },
  confName: { fontSize: 17, fontWeight: "800", color: colors.text },
  confTheme: { fontSize: 12.5, color: colors.primary, marginTop: 3 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  locationText: { fontSize: 12, color: colors.muted },
  dayPickerRow: { marginBottom: 12 },
  dayPill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  dayPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayPillText: { fontSize: 12, fontWeight: "700", color: colors.muted },
  dayPillTextActive: { color: "#fff" },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24,
  },
  empty: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
  sessionCard: {
    flexDirection: "row", gap: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 12,
  },
  sessionCardActive: { borderColor: colors.primary },
  sessionCardDim: { opacity: 0.55 },
  sessionBar: { width: 4, borderRadius: 2 },
  sessionTime: { width: 56 },
  sessionTimeText: { fontSize: 14, fontWeight: "800", color: colors.text },
  sessionTimeEnd: { fontSize: 10.5, color: colors.muted, marginTop: 1 },
  sessionBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  badge: { backgroundColor: colors.cardAlt, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2.5 },
  badgeText: { fontSize: 9.5, fontWeight: "700", color: colors.text },
  badgeOutline: {
    flexDirection: "row", alignItems: "center", gap: 3,
    borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2.5,
  },
  badgeOutlineText: { fontSize: 9.5, fontWeight: "700", color: colors.muted },
  sessionTitle: { fontSize: 14.5, fontWeight: "700", color: colors.text, marginTop: 5 },
  sessionTitleCancelled: { textDecorationLine: "line-through", color: colors.muted },
  sessionMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  sessionMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  sessionMetaText: { fontSize: 11.5, color: colors.muted },
});
