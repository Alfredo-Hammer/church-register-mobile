import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import SideMenu from "../components/SideMenu";
import NextUpCard from "../components/NextUpCard";
import QuickAction from "../components/QuickAction";
import LiveNowBanner from "../components/LiveNowBanner";
import LiveStreamBanner from "../components/LiveStreamBanner";
import PhotoCarousel from "../components/PhotoCarousel";
import {
  announcementsService, membersService, visitorsService, groupsService,
  eventsService, prayerService, baptismsService, financesService, settingsService,
} from "../services/api";
import { getLastSeenAnnouncementAt, hasUnseenAnnouncement } from "../utils/announcementsSeen";
import { pickNextItem, pickLiveNow, daysUntilBirthday } from "../utils/schedule";
import { colors, gradient, ROLE_META, greetingForTime } from "../theme";

const FINANCE_ROLES = ["ADMIN", "PASTOR", "TESORERO"];

// Conferencias, Visitantes, Bautismos y Líderes son de uso más esporádico
// que Eventos/Actividades/Miembros (que ya tienen su propia pestaña) — viven
// en el menú lateral en vez de ocupar la pantalla principal. Avisos y Grupos
// también están acá, pero además tienen su acceso rápido en el header (ver
// QUICK_ACTIONS) por ser los más usados de este grupo.
const MENU_ITEMS = [
  { key: "conference", icon: "qr-code-outline", iconColor: "#60a5fa", title: "Conferencias", subtitle: "Escanear gafetes y ver asistencia", screen: "ConferenceList" },
  { key: "groups", icon: "people-circle-outline", iconColor: "#f472b6", title: "Grupos", subtitle: "Ver ministerios y líderes", screen: "Groups" },
  { key: "announcements", icon: "megaphone-outline", iconColor: "#38bdf8", title: "Avisos", subtitle: "Publicar y ver anuncios", screen: "Announcements" },
  { key: "visitors", icon: "person-add-outline", iconColor: "#fbbf24", title: "Visitantes", subtitle: "Buscar y ver seguimiento", screen: "Visitors" },
  { key: "baptisms", icon: "water-outline", iconColor: "#22d3ee", title: "Bautismos", subtitle: "Ver historial de bautismos", screen: "BaptismList" },
  { key: "leaders", icon: "ribbon-outline", iconColor: "#fb923c", title: "Líderes", subtitle: "Cargos por grupo y área", screen: "Leaders" },
];

function MiniStat({ icon, iconColor, label, value, sub }) {
  return (
    <View style={styles.miniStat}>
      <View style={[styles.miniStatIcon, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <Text style={styles.miniStatValue}>{value ?? "—"}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
      {sub ? <Text style={styles.miniStatSub}>{sub}</Text> : null}
    </View>
  );
}

function birthdayLabel(days) {
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}

function BirthdayRow({ item }) {
  const days = daysUntilBirthday(item.birth_date);
  return (
    <View style={styles.birthdayRow}>
      <View style={styles.birthdayIcon}>
        <Ionicons name="gift-outline" size={15} color="#f472b6" />
      </View>
      <Text style={styles.birthdayName} numberOfLines={1}>{item.first_name} {item.last_name}</Text>
      <Text style={[styles.birthdayWhen, days === 0 && styles.birthdayToday]}>{birthdayLabel(days)}</Text>
    </View>
  );
}

// Home de staff: saludo + estado de la iglesia a la que pertenece (logo,
// próximo evento/oración, cumpleaños de la semana) + resumen rápido. Antes
// solo mostraba el saludo y 3 stats — sin ninguna marca visual de la
// iglesia, a diferencia del home de miembro que sí la tiene desde el día 1.
export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] || "";
  const initial = (user?.fullName?.trim()?.charAt(0) || "?").toUpperCase();
  const role = ROLE_META[user?.role] || { label: user?.role || "", color: colors.muted };
  const canSeeFinances = FINANCE_ROLES.includes(user?.role);

  const [hasNewAnnouncement, setHasNewAnnouncement] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickStats, setQuickStats] = useState(null);
  const [church, setChurch] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [nextItem, setNextItem] = useState(null);
  const [liveNow, setLiveNow] = useState(null);
  const [birthdays, setBirthdays] = useState([]);
  const [baptismStats, setBaptismStats] = useState(null);
  const [finSummary, setFinSummary] = useState(null);

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

      (async () => {
        try {
          const c = await settingsService.getChurch();
          setChurch(c);
        } catch { /* silencioso */ }
      })();

      (async () => {
        try {
          const p = await settingsService.getChurchPhotos();
          setPhotos(p.photos || []);
        } catch { /* silencioso */ }
      })();

      (async () => {
        try {
          const [ev, pd] = await Promise.all([
            eventsService.getAll({ limit: 50 }),
            prayerService.getAll({ activeOnly: "true" }),
          ]);
          const now = new Date();
          setNextItem(pickNextItem(ev.events || [], pd.prayer_days || [], now));
          setLiveNow(pickLiveNow(ev.events || [], pd.prayer_days || [], now));
        } catch { /* silencioso */ }
      })();

      (async () => {
        try {
          const now = new Date();
          const month = now.getMonth() + 1;
          const daysLeftInMonth = new Date(now.getFullYear(), month, 0).getDate() - now.getDate();
          const requests = [membersService.getBirthdays({ month })];
          if (daysLeftInMonth < 7) {
            requests.push(membersService.getBirthdays({ month: (month % 12) + 1 }));
          }
          const results = await Promise.all(requests);
          const all = results.flatMap((r) => r.birthdays || []);
          const withDays = all
            .map((m) => ({ ...m, _days: daysUntilBirthday(m.birth_date) }))
            .filter((m) => m._days <= 6)
            .sort((a, b) => a._days - b._days);
          setBirthdays(withDays);
        } catch { /* silencioso */ }
      })();

      (async () => {
        try {
          const bs = await baptismsService.getStats();
          setBaptismStats(bs);
        } catch { /* silencioso */ }
      })();

      if (canSeeFinances) {
        (async () => {
          try {
            const fs = await financesService.getSummary();
            setFinSummary(fs.summary);
          } catch { /* silencioso */ }
        })();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canSeeFinances])
  );

  const fmtMoney = (v) => "$" + Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerTop}>
            {church?.logoUrl ? (
              <Image source={{ uri: church.logoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
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
            {(church?.name || user?.churchName) && (
              <Text style={styles.churchName} numberOfLines={1}>{church?.name || user.churchName}</Text>
            )}
          </View>
          {church?.pastorName ? <Text style={styles.pastorName}>Pastor {church.pastorName}</Text> : null}

          <View style={styles.quickActions}>
            <QuickAction icon="megaphone-outline" label="Avisos" onPress={() => navigation.navigate("Announcements")} />
            <QuickAction icon="qr-code-outline" label="Conferencias" onPress={() => navigation.navigate("ConferenceList")} />
            <QuickAction icon="people-circle-outline" label="Grupos" onPress={() => navigation.navigate("Groups")} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {church?.liveStreamUrl && (
          <View style={{ marginBottom: 18 }}>
            <LiveStreamBanner liveStreamUrl={church.liveStreamUrl} />
          </View>
        )}

        {photos.length > 0 && (
          <View style={{ marginBottom: 18 }}>
            <PhotoCarousel photos={photos} churchId={user?.churchId} />
          </View>
        )}

        {liveNow && (
          <View style={{ marginBottom: 18 }}>
            <LiveNowBanner item={liveNow} />
          </View>
        )}

        {nextItem && (
          <View style={{ marginBottom: 18 }}>
            <NextUpCard item={nextItem} />
          </View>
        )}

        {birthdays.length > 0 && (
          <View style={styles.birthdaySection}>
            <Text style={styles.sectionTitle}>Cumpleaños esta semana</Text>
            <View style={styles.birthdayCard}>
              {birthdays.map((m) => <BirthdayRow key={m.id} item={m} />)}
            </View>
          </View>
        )}

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
          <MiniStat icon="water-outline" iconColor="#22d3ee" label="Bautismos"
            value={baptismStats?.total} sub={baptismStats?.year ? `en ${baptismStats.year}` : undefined} />
          {canSeeFinances && (
            <MiniStat icon="cash-outline" iconColor={Number(finSummary?.balance) >= 0 ? "#34d399" : "#f87171"}
              label="Balance" value={finSummary ? fmtMoney(finSummary.balance) : undefined}
              sub={finSummary ? (Number(finSummary.balance) >= 0 ? "Superávit" : "Déficit") : undefined} />
          )}
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
    paddingBottom: 22,
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
  pastorName: { color: "rgba(255,255,255,0.65)", fontSize: 12.5, marginTop: 4 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
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
  miniStatsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  miniStat: {
    width: "31%", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 12, gap: 4,
  },
  miniStatIcon: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  miniStatValue: { fontSize: 17, fontWeight: "800", color: colors.text },
  miniStatLabel: { fontSize: 10.5, color: colors.muted, fontWeight: "600" },
  miniStatSub: { fontSize: 9.5, color: colors.muted },
  birthdaySection: { marginBottom: 22 },
  birthdayCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 6, marginTop: 10,
  },
  birthdayRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 6 },
  birthdayIcon: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: "#f472b622",
    alignItems: "center", justifyContent: "center",
  },
  birthdayName: { flex: 1, fontSize: 13.5, fontWeight: "600", color: colors.text },
  birthdayWhen: { fontSize: 11.5, color: colors.muted, fontWeight: "600" },
  birthdayToday: { color: "#f472b6" },
  announcementBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#38bdf822", borderWidth: 1, borderColor: "#38bdf840",
    borderRadius: 12, padding: 12, marginTop: 16,
  },
  announcementText: { flex: 1, fontSize: 12.5, color: colors.text, fontWeight: "600" },
});
