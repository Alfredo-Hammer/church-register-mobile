import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import SideMenu from "../components/SideMenu";
import { announcementsService, membersService, visitorsService, groupsService } from "../services/api";
import { getLastSeenAnnouncementAt, hasUnseenAnnouncement } from "../utils/announcementsSeen";
import { colors, gradient, ROLE_META, greetingForTime } from "../theme";

// Conferencias, Grupos, Avisos, Visitantes, Bautismos y Líderes son de uso
// más esporádico que Eventos/Actividades/Miembros (que ya tienen su propia
// pestaña) — viven en el menú lateral en vez de ocupar la pantalla principal.
const MENU_ITEMS = [
  { key: "conference", icon: "qr-code-outline", iconColor: "#60a5fa", title: "Conferencias", subtitle: "Escanear gafetes y ver asistencia", screen: "ConferenceList" },
  { key: "groups", icon: "people-circle-outline", iconColor: "#f472b6", title: "Grupos", subtitle: "Ver ministerios y líderes", screen: "Groups" },
  { key: "announcements", icon: "megaphone-outline", iconColor: "#38bdf8", title: "Avisos", subtitle: "Publicar y ver anuncios", screen: "Announcements" },
  { key: "visitors", icon: "person-add-outline", iconColor: "#fbbf24", title: "Visitantes", subtitle: "Buscar y ver seguimiento", screen: "Visitors" },
  { key: "baptisms", icon: "water-outline", iconColor: "#22d3ee", title: "Bautismos", subtitle: "Ver historial de bautismos", screen: "BaptismList" },
  { key: "leaders", icon: "ribbon-outline", iconColor: "#fb923c", title: "Líderes", subtitle: "Cargos por grupo y área", screen: "Leaders" },
];

function MiniStat({ icon, iconColor, label, value }) {
  return (
    <View style={styles.miniStat}>
      <View style={[styles.miniStatIcon, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <Text style={styles.miniStatValue}>{value ?? "—"}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] || "";
  const initial = (user?.fullName?.trim()?.charAt(0) || "?").toUpperCase();
  const role = ROLE_META[user?.role] || { label: user?.role || "", color: colors.muted };
  const [hasNewAnnouncement, setHasNewAnnouncement] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickStats, setQuickStats] = useState(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [data, lastSeenAt] = await Promise.all([
            announcementsService.getAll(),
            getLastSeenAnnouncementAt(),
          ]);
          setHasNewAnnouncement(hasUnseenAnnouncement(data.announcements, lastSeenAt));
        } catch {
          setHasNewAnnouncement(false);
        }
      })();
      (async () => {
        try {
          const [ms, vs, gs] = await Promise.all([
            membersService.getStats(),
            visitorsService.getStats(),
            groupsService.getStats(),
          ]);
          setQuickStats({
            active: ms.active,
            visitors: vs.stats?.total,
            groups: gs.total,
          });
        } catch { /* silencioso */ }
      })();
    }, [])
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton} onPress={() => setMenuOpen(true)}>
                <Ionicons name="menu-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={logout}>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.greeting}>{greetingForTime()},</Text>
          <Text style={styles.name}>{firstName}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.rolePill, { backgroundColor: role.color + "33", borderColor: role.color }]}>
              <Text style={[styles.rolePillText, { color: role.color }]}>{role.label}</Text>
            </View>
            {user?.churchName && <Text style={styles.churchName} numberOfLines={1}>{user.churchName}</Text>}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.summaryRow}>
          <Text style={styles.sectionTitle}>Resumen rápido</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ResumenTab")}>
            <Text style={styles.summaryLink}>Ver todo</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.miniStatsRow}>
          <MiniStat icon="people-outline" iconColor="#60a5fa" label="Miembros" value={quickStats?.active} />
          <MiniStat icon="person-add-outline" iconColor="#fbbf24" label="Visitantes" value={quickStats?.visitors} />
          <MiniStat icon="people-circle-outline" iconColor="#f472b6" label="Grupos" value={quickStats?.groups} />
        </View>

        {hasNewAnnouncement && (
          <TouchableOpacity
            style={styles.announcementBanner}
            onPress={() => navigation.navigate("Announcements")}
          >
            <Ionicons name="megaphone-outline" size={16} color="#38bdf8" />
            <Text style={styles.announcementText}>Hay un aviso nuevo — toca para verlo</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.muted} />
          </TouchableOpacity>
        )}
      </ScrollView>

      <SideMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={MENU_ITEMS.map((m) => ({ ...m, subtitle: m.key === "announcements" && hasNewAnnouncement ? "● " + m.subtitle : m.subtitle }))}
        onNavigate={(screen) => navigation.navigate(screen)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 15, marginTop: 18 },
  name: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" },
  rolePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  rolePillText: { fontSize: 11.5, fontWeight: "700" },
  churchName: { color: "rgba(255,255,255,0.75)", fontSize: 13, flexShrink: 1 },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryLink: { fontSize: 12.5, fontWeight: "700", color: colors.primary },
  miniStatsRow: { flexDirection: "row", gap: 10 },
  miniStat: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 12, gap: 4,
  },
  miniStatIcon: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  miniStatValue: { fontSize: 17, fontWeight: "800", color: colors.text },
  miniStatLabel: { fontSize: 10.5, color: colors.muted, fontWeight: "600" },
  announcementBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#38bdf822", borderWidth: 1, borderColor: "#38bdf840",
    borderRadius: 12, padding: 12, marginTop: 16,
  },
  announcementText: { flex: 1, fontSize: 12.5, color: colors.text, fontWeight: "600" },
});
