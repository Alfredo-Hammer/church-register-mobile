import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import ModuleCard from "../components/ModuleCard";
import { announcementsService } from "../services/api";
import { getLastSeenAnnouncementAt, hasUnseenAnnouncement } from "../utils/announcementsSeen";
import { colors, gradient, ROLE_META, greetingForTime } from "../theme";

// Módulos que se van a ir prendiendo con el tiempo — Conferencias es el
// único real por ahora (ver conversación: es donde la app nativa gana
// frente a la web, cámara directa sin el rodeo de HTTPS+LAN). El resto
// queda visible pero marcado "Próximamente" para que la pantalla se sienta
// como el inicio de una app completa, no un menú de una sola opción.
const MODULES = [
  { key: "conference", icon: "qr-code-outline", iconColor: "#60a5fa", title: "Conferencias", subtitle: "Escanear gafetes y ver asistencia", screen: "ConferenceList" },
  { key: "attendance", icon: "checkmark-done-circle-outline", iconColor: "#34d399", title: "Asistencia", subtitle: "Tomar lista de un evento", screen: "EventList" },
  { key: "groups", icon: "people-circle-outline", iconColor: "#f472b6", title: "Grupos", subtitle: "Ver ministerios y líderes", screen: "Groups" },
  { key: "announcements", icon: "megaphone-outline", iconColor: "#38bdf8", title: "Avisos", subtitle: "Publicar y ver anuncios", screen: "Announcements" },
  { key: "visitors", icon: "person-add-outline", iconColor: "#fbbf24", title: "Visitantes", subtitle: "Registrar y dar seguimiento" },
  { key: "members", icon: "people-outline", iconColor: "#a78bfa", title: "Miembros", subtitle: "Buscar y ver perfiles" },
];

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] || "";
  const initial = (user?.fullName?.trim()?.charAt(0) || "?").toUpperCase();
  const role = ROLE_META[user?.role] || { label: user?.role || "", color: colors.muted };
  const [hasNewAnnouncement, setHasNewAnnouncement] = useState(false);

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
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
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
        <Text style={styles.sectionTitle}>Módulos</Text>
        <View style={styles.grid}>
          {MODULES.map((m) => (
            <ModuleCard
              key={m.key}
              icon={m.icon}
              iconColor={m.iconColor}
              title={m.title}
              subtitle={m.subtitle}
              comingSoon={!m.screen}
              badge={m.key === "announcements" && hasNewAnnouncement}
              onPress={() => m.screen && navigation.navigate(m.screen)}
            />
          ))}
        </View>
        <Text style={styles.footerNote}>Más módulos próximamente</Text>
      </ScrollView>
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
  logoutButton: {
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  footerNote: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 20 },
});
