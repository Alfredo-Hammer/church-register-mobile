import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { settingsService } from "../services/api";
import { colors, ROLE_META } from "../theme";

// Todo lo que antes vivía apretado en el header del Inicio (nombre, rol,
// iglesia, pastor) se movió acá — el header quedó solo con lo mínimo
// (saludo corto + accesos rápidos) para no ocupar tanta pantalla.
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [church, setChurch] = useState(null);
  const initial = (user?.fullName?.trim()?.charAt(0) || "?").toUpperCase();
  const role = ROLE_META[user?.role] || { label: user?.role || "", color: colors.muted };

  useEffect(() => {
    settingsService.getChurch().then(setChurch).catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarWrap}>
        {church?.logoUrl ? (
          <Image source={{ uri: church.logoUrl }} style={styles.churchLogo} />
        ) : null}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <View style={[styles.rolePill, { backgroundColor: role.color + "33", borderColor: role.color }]}>
          <Text style={[styles.rolePillText, { color: role.color }]}>{role.label}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <InfoRow icon="mail-outline" label="Correo" value={user?.email} />
        <InfoRow icon="business-outline" label="Iglesia" value={church?.name || user?.churchName} />
        <InfoRow icon="person-circle-outline" label="Pastor" value={church?.pastorName} />
        <InfoRow icon="location-outline" label="Ciudad" value={[church?.city, church?.country].filter(Boolean).join(", ")} />
        <InfoRow icon="call-outline" label="Teléfono de la iglesia" value={church?.phone} />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  avatarWrap: { alignItems: "center", marginBottom: 24 },
  churchLogo: { width: 44, height: 44, borderRadius: 12, marginBottom: 10 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 26, fontWeight: "800" },
  name: { color: colors.text, fontSize: 19, fontWeight: "800" },
  rolePill: { marginTop: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  rolePillText: { fontSize: 12, fontWeight: "700" },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 6,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 8 },
  infoIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: `${colors.primary}1a`,
    alignItems: "center", justifyContent: "center",
  },
  infoLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: "600", marginTop: 1 },
  logoutButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.danger, borderRadius: 12, paddingVertical: 13, marginTop: 24,
  },
  logoutText: { color: "#fff", fontSize: 14.5, fontWeight: "700" },
});
