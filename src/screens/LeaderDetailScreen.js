import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { leadersService } from "../services/api";
import { colors } from "../theme";

const STATUS_COLOR = { ACTIVO: colors.success, INACTIVO: colors.danger };

function formatLongDate(d) {
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.muted} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// Vista de solo lectura, mismo criterio que MemberDetailScreen y
// BaptismDetailScreen: asignar o editar un cargo sigue siendo cosa de la
// web (incluye la reconfirmación de contraseña para cargos adicionales,
// que no tiene sentido replicar aquí).
export default function LeaderDetailScreen({ route }) {
  const { leaderId } = route.params;
  const [leader, setLeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await leadersService.getById(leaderId);
        setLeader(data);
      } catch {
        setError("No se pudo cargar el líder.");
      }
      setLoading(false);
    })();
  }, [leaderId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !leader) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={22} color={colors.muted} />
        <Text style={styles.emptyText}>{error || "Líder no encontrado."}</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLOR[leader.status] || colors.muted;
  const initial = (leader.firstName?.charAt(0) || "?").toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {leader.photoUrl ? (
          <Image source={{ uri: leader.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <Text style={styles.name}>{leader.firstName} {leader.lastName}</Text>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {leader.status === "ACTIVO" ? "Activo" : "Inactivo"}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <InfoRow icon="ribbon-outline" label="Cargo" value={leader.position} />
        <InfoRow icon="pricetag-outline" label="Área" value={leader.area} />
        <InfoRow icon="people-circle-outline" label="Grupo" value={leader.groupName} />
        <InfoRow icon="calendar-outline" label="Desde" value={leader.startDate ? formatLongDate(leader.startDate) : null} />
        <InfoRow icon="call-outline" label="Teléfono" value={leader.phone} />
        <InfoRow icon="mail-outline" label="Correo" value={leader.email} />
      </View>

      {leader.notes ? (
        <View style={styles.notesCard}>
          <View style={styles.metaLineRow}>
            <Ionicons name="document-text-outline" size={14} color={colors.primary} />
            <Text style={styles.notesLabel}>Notas</Text>
          </View>
          <Text style={styles.notesText}>{leader.notes}</Text>
        </View>
      ) : null}

      {leader.authorizedByName ? (
        <View style={styles.authNote}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.muted} />
          <Text style={styles.authNoteText}>
            Cargo adicional autorizado por {leader.authorizedByName}
            {leader.authorizedAt ? ` el ${formatLongDate(leader.authorizedAt)}` : ""}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.background },
  header: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 84, height: 84, borderRadius: 42, marginBottom: 12 },
  avatarPlaceholder: {
    width: 84, height: 84, borderRadius: 42, marginBottom: 12,
    backgroundColor: colors.cardAlt, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontSize: 30, fontWeight: "800" },
  name: { fontSize: 19, fontWeight: "800", color: colors.text, textAlign: "center" },
  statusPill: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusPillText: { fontSize: 11.5, fontWeight: "700" },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 16, gap: 14,
  },
  infoRow: { flexDirection: "row", gap: 10 },
  infoLabel: { fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, color: colors.text, marginTop: 2 },
  metaLineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notesCard: {
    backgroundColor: `${colors.primary}14`, borderWidth: 1, borderColor: `${colors.primary}40`,
    borderRadius: 14, padding: 16, marginTop: 14,
  },
  notesLabel: { fontSize: 12.5, fontWeight: "700", color: colors.primary },
  notesText: { fontSize: 13.5, color: colors.text, marginTop: 8, lineHeight: 20 },
  authNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    marginTop: 14, paddingHorizontal: 2,
  },
  authNoteText: { flex: 1, fontSize: 11.5, color: colors.muted, lineHeight: 16 },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: "center" },
});
