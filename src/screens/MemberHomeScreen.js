import { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { publicService } from "../services/api";
import { getLastSeenAnnouncementAt, markAnnouncementsSeen } from "../utils/announcementsSeen";
import { colors, gradient } from "../theme";
import { pickNextItem, pickLiveNow } from "../utils/schedule";
import NextUpCard from "../components/NextUpCard";
import LiveNowBanner from "../components/LiveNowBanner";
import PhotoCarousel from "../components/PhotoCarousel";
import LiveStreamBanner from "../components/LiveStreamBanner";

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

// Home de miembro: lo esencial de un vistazo (video/transmisión, fotos,
// avisos, qué sigue) — el calendario completo y "Más" (grupos, contacto)
// ahora tienen su propia pestaña, en vez de ser todo una sola lista larga
// como era antes. Vía endpoints públicos scoped por church_id (todavía no
// hay sesión de miembro real, solo la asociación dispositivo↔iglesia del
// código de invitación).
export default function MemberHomeScreen({ navigation }) {
  const { joinedChurch, leaveChurch } = useAuth();
  const [events, setEvents] = useState([]);
  const [prayerDays, setPrayerDays] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [liveStreamUrl, setLiveStreamUrl] = useState(null);
  const [defaultVideoUrl, setDefaultVideoUrl] = useState(null);
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (!joinedChurch?.id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [eventsData, prayerData, announcementsData, photosData, liveStreamData] = await Promise.all([
        publicService.getUpcomingEvents(joinedChurch.id),
        publicService.getPrayerDays(joinedChurch.id),
        publicService.getAnnouncements(joinedChurch.id),
        publicService.getPhotos(joinedChurch.id),
        publicService.getLiveStream(joinedChurch.id),
      ]);
      setEvents(eventsData.events || []);
      setPrayerDays(prayerData.prayerDays || []);
      setAnnouncements(announcementsData.announcements || []);
      setPhotos(photosData.photos || []);
      setLiveStreamUrl(liveStreamData.liveStreamUrl || null);
      setDefaultVideoUrl(liveStreamData.defaultVideoUrl || null);
      const previousSeenAt = await getLastSeenAnnouncementAt();
      setLastSeenAt(previousSeenAt);
      if (announcementsData.announcements?.[0]) {
        markAnnouncementsSeen(announcementsData.announcements[0].created_at);
      }
    } catch { /* silencioso */ }
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
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor={colors.primary} />}
      >
        {(liveStreamUrl || defaultVideoUrl) && (
          <View style={{ marginBottom: 18 }}>
            <LiveStreamBanner liveStreamUrl={liveStreamUrl} defaultVideoUrl={defaultVideoUrl} />
          </View>
        )}

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

        {loading && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        )}
      </ScrollView>
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
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },
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
});
