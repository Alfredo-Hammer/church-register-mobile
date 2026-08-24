import { useCallback, useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  FlatList, ActivityIndicator, RefreshControl, Linking, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { publicService } from "../services/api";
import { getLastSeenAnnouncementAt, markAnnouncementsSeen } from "../utils/announcementsSeen";
import { colors, gradient, EVENT_TYPE_META, DAY_NAMES } from "../theme";
import { formatEventDate, formatDateRange, formatTime, pickNextItem, pickLiveNow, isEventLiveNow } from "../utils/schedule";
import NextUpCard from "../components/NextUpCard";
import QuickAction from "../components/QuickAction";
import LiveNowBanner from "../components/LiveNowBanner";
import PhotoCarousel from "../components/PhotoCarousel";

function openPhone(phone) {
  Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`);
}

function openMaps(address) {
  const query = encodeURIComponent(address);
  const url = Platform.OS === "ios" ? `maps:0,0?q=${query}` : `geo:0,0?q=${query}`;
  Linking.openURL(url).catch(() => Linking.openURL(`https://maps.google.com/?q=${query}`));
}

function openWebsite(website) {
  const url = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  Linking.openURL(url);
}

function formatAnnouncementDate(iso) {
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long" });
}

function AnnouncementCard({ item, isNew }) {
  return (
    <View style={styles.announcementCard}>
      <View style={styles.announcementIcon}>
        <Ionicons name="megaphone" size={15} color={colors.warning} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.announcementTitleRow}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          {isNew && (
            <View style={styles.newPill}>
              <Text style={styles.newPillText}>Nuevo</Text>
            </View>
          )}
        </View>
        <Text style={styles.announcementBody} numberOfLines={3}>{item.body}</Text>
        <Text style={styles.announcementDate}>{formatAnnouncementDate(item.created_at)}</Text>
      </View>
    </View>
  );
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
          {formatTime(item.start_time)}
          {item.end_time ? ` – ${formatTime(item.end_time)}` : ""}
          {item.location ? ` · ${item.location}` : ""}
        </Text>
        {item.leader ? (
          <View style={styles.metaLineRow}>
            <Ionicons name="person-outline" size={11} color={colors.muted} />
            <Text style={styles.prayerLeader}>{item.leader}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function EventCard({ item }) {
  const meta = EVENT_TYPE_META[item.event_type] || { label: item.event_type, color: colors.primary };
  const isConference = item.kind === "conference";
  const isLive = isEventLiveNow(item);
  return (
    <View style={[styles.eventCard, { borderLeftColor: isLive ? colors.danger : meta.color }]}>
      <View style={styles.eventHeaderRow}>
        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
        {isLive ? (
          <View style={styles.liveTag}>
            <View style={styles.liveTagDot} />
            <Text style={styles.liveTagText}>EN VIVO</Text>
          </View>
        ) : (
          <View style={[styles.eventBadge, { backgroundColor: `${meta.color}22` }]}>
            <Text style={[styles.eventBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        )}
      </View>
      <View style={styles.metaLineRow}>
        <Ionicons name="calendar-outline" size={13} color={colors.muted} />
        <Text style={styles.eventDate}>
          {isConference ? formatDateRange(item.date, item.end_date) : formatEventDate(item.date)}
        </Text>
      </View>
      {isConference && item.location ? (
        <View style={styles.metaLineRow}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={styles.eventLocation}>{item.location}</Text>
        </View>
      ) : null}
      {item.description ? (
        <Text style={styles.eventDescription} numberOfLines={2}>{item.description}</Text>
      ) : null}
    </View>
  );
}

// Dashboard de miembro: horario de oración + próximos eventos/conferencias
// de su iglesia, vía endpoints públicos scoped por church_id (todavía no
// hay sesión de miembro real, solo la asociación dispositivo↔iglesia del
// código de invitación). Historial personal y autoregistro quedan para
// cuando exista una identidad de miembro de verdad.
export default function MemberHomeScreen({ navigation }) {
  const { joinedChurch, leaveChurch } = useAuth();
  const [events, setEvents] = useState([]);
  const [prayerDays, setPrayerDays] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (!joinedChurch?.id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const [eventsData, prayerData, announcementsData, photosData] = await Promise.all([
        publicService.getUpcomingEvents(joinedChurch.id),
        publicService.getPrayerDays(joinedChurch.id),
        publicService.getAnnouncements(joinedChurch.id),
        publicService.getPhotos(joinedChurch.id),
      ]);
      setEvents(eventsData.events || []);
      setPrayerDays(prayerData.prayerDays || []);
      setAnnouncements(announcementsData.announcements || []);
      setPhotos(photosData.photos || []);
      const previousSeenAt = await getLastSeenAnnouncementAt();
      setLastSeenAt(previousSeenAt);
      if (announcementsData.announcements?.[0]) {
        markAnnouncementsSeen(announcementsData.announcements[0].created_at);
      }
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

  const nextItem = useMemo(() => pickNextItem(events, prayerDays), [events, prayerDays]);
  const liveNow = useMemo(() => pickLiveNow(events, prayerDays), [events, prayerDays]);

  const initial = (joinedChurch?.name?.trim()?.charAt(0) || "?").toUpperCase();

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerTop}>
            {joinedChurch?.logoUrl ? (
              <Image source={{ uri: joinedChurch.logoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.leaveIconButton} onPress={leaveChurch}>
              <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.churchName} numberOfLines={2}>{joinedChurch?.name}</Text>
          {joinedChurch?.pastorName ? (
            <Text style={styles.pastorName}>Pastor {joinedChurch.pastorName}</Text>
          ) : null}

          <View style={styles.quickActions}>
            <QuickAction icon="people-outline" label="Grupos" onPress={() => navigation.navigate("Groups")} />
            {joinedChurch?.phone && (
              <QuickAction icon="call-outline" label="Llamar" onPress={() => openPhone(joinedChurch.phone)} />
            )}
            {joinedChurch?.address && (
              <QuickAction icon="navigate-outline" label="Cómo llegar" onPress={() => openMaps(joinedChurch.address)} />
            )}
            {joinedChurch?.website && (
              <QuickAction icon="globe-outline" label="Sitio web" onPress={() => openWebsite(joinedChurch.website)} />
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        style={styles.body}
        contentContainerStyle={styles.listContent}
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View>
            {photos.length > 0 && (
              <View style={{ marginBottom: 18 }}>
                <PhotoCarousel photos={photos} churchId={joinedChurch?.id} />
              </View>
            )}

            {announcements.length > 0 && (
              <View style={styles.announcementSection}>
                {announcements.slice(0, 3).map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    item={a}
                    isNew={!lastSeenAt || new Date(a.created_at) > new Date(lastSeenAt)}
                  />
                ))}
              </View>
            )}

            {liveNow && (
              <View style={{ marginTop: 18 }}>
                <LiveNowBanner item={liveNow} />
              </View>
            )}

            {nextItem && (
              <View style={{ marginTop: liveNow ? 12 : 18 }}>
                <NextUpCard item={nextItem} />
              </View>
            )}

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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  avatar: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  leaveIconButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  churchName: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 16 },
  pastorName: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 3 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  body: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: colors.muted,
    textTransform: "uppercase", letterSpacing: 0.5,
    marginTop: 22, marginBottom: 10,
  },
  metaLineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  announcementSection: { width: "100%", gap: 10 },
  announcementCard: {
    flexDirection: "row", gap: 10,
    backgroundColor: `${colors.warning}14`,
    borderWidth: 1, borderColor: `${colors.warning}40`,
    borderRadius: 14, padding: 14,
  },
  announcementIcon: {
    width: 28, height: 28, borderRadius: 9, marginTop: 1,
    backgroundColor: `${colors.warning}22`,
    alignItems: "center", justifyContent: "center",
  },
  announcementTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  announcementTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  newPill: { backgroundColor: colors.danger, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  newPillText: { color: "#fff", fontSize: 9.5, fontWeight: "800", textTransform: "uppercase" },
  announcementBody: { fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 18 },
  announcementDate: { fontSize: 11, color: colors.muted, marginTop: 6, textTransform: "capitalize" },
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
  prayerLeader: { fontSize: 11, color: colors.muted },
  eventCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 4, borderRadius: 14, padding: 14, marginTop: 12,
  },
  eventHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  eventTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  eventBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  eventBadgeText: { fontSize: 10.5, fontWeight: "700" },
  liveTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.danger, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  liveTagDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" },
  liveTagText: { fontSize: 9.5, fontWeight: "800", color: "#fff", letterSpacing: 0.4 },
  eventDate: { fontSize: 12.5, color: colors.muted, textTransform: "capitalize" },
  eventLocation: { fontSize: 12, color: colors.muted },
  eventDescription: { fontSize: 12.5, color: colors.muted, marginTop: 8 },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24, marginTop: 12,
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
});
