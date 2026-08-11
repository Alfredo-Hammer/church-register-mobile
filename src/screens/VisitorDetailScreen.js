import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { visitorsService } from "../services/api";
import { colors, VISITOR_STAGE_META, HOW_THEY_CAME_META } from "../theme";

const GENDER_LABELS = { MASCULINO: "Masculino", FEMENINO: "Femenino" };
const FOLLOW_UP_TYPE_LABELS = {
  LLAMADA: "Llamada", MENSAJE: "Mensaje", VISITA_DOMICILIO: "Visita a domicilio",
  REUNION: "Reunión", OTRO: "Otro",
};
const RESULT_META = {
  POSITIVO: { label: "Positivo", color: "#34d399" },
  NEUTRAL: { label: "Neutral", color: "#fbbf24" },
  SIN_RESPUESTA: { label: "Sin respuesta", color: "#94a3b8" },
  NEGATIVO: { label: "Negativo", color: "#f87171" },
};

function formatDate(d) {
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

function FollowUpRow({ item }) {
  const result = RESULT_META[item.result];
  return (
    <View style={styles.followUpRow}>
      <View style={styles.followUpHeader}>
        <Text style={styles.followUpType}>{FOLLOW_UP_TYPE_LABELS[item.type] || item.type}</Text>
        {result && (
          <View style={[styles.resultPill, { backgroundColor: `${result.color}22` }]}>
            <Text style={[styles.resultPillText, { color: result.color }]}>{result.label}</Text>
          </View>
        )}
      </View>
      <Text style={styles.followUpDate}>{formatDate(item.date)}</Text>
      {item.notes ? <Text style={styles.followUpNotes}>{item.notes}</Text> : null}
    </View>
  );
}

// Vista de solo lectura, igual que MemberDetailScreen — el seguimiento
// (crear llamada/visita, cambiar etapa) sigue siendo cosa de la web.
export default function VisitorDetailScreen({ route }) {
  const { visitorId } = route.params;
  const [visitor, setVisitor] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await visitorsService.getById(visitorId);
        setVisitor(data.visitor);
        setFollowUps(data.followUps || []);
      } catch {
        setError("No se pudo cargar el visitante.");
      }
      setLoading(false);
    })();
  }, [visitorId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !visitor) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={22} color={colors.muted} />
        <Text style={styles.emptyText}>{error || "Visitante no encontrado."}</Text>
      </View>
    );
  }

  const stage = VISITOR_STAGE_META[visitor.stage] || { label: visitor.stage, color: colors.muted };
  const initial = (visitor.first_name?.charAt(0) || "?").toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{visitor.first_name} {visitor.last_name}</Text>
        <View style={[styles.stagePill, { backgroundColor: `${stage.color}22` }]}>
          <Text style={[styles.stagePillText, { color: stage.color }]}>{stage.label}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <InfoRow icon="call-outline" label="Teléfono" value={visitor.phone} />
        <InfoRow icon="mail-outline" label="Correo" value={visitor.email} />
        <InfoRow icon="location-outline" label="Dirección" value={visitor.address} />
        <InfoRow icon="calendar-outline" label="Primera visita" value={visitor.first_visit_date ? formatDate(visitor.first_visit_date) : null} />
        <InfoRow icon="person-outline" label="Sexo" value={GENDER_LABELS[visitor.gender]} />
        <InfoRow icon="compass-outline" label="Cómo llegó" value={HOW_THEY_CAME_META[visitor.how_they_came]} />
        <InfoRow icon="hand-left-outline" label="Invitado por" value={visitor.invited_by} />
        <InfoRow icon="shield-checkmark-outline" label="Responsable de seguimiento" value={visitor.responsible} />
      </View>

      {visitor.notes ? (
        <View style={styles.notesCard}>
          <View style={styles.metaLineRow}>
            <Ionicons name="document-text-outline" size={14} color={colors.primary} />
            <Text style={styles.notesLabel}>Notas</Text>
          </View>
          <Text style={styles.notesText}>{visitor.notes}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Seguimientos ({followUps.length})</Text>
      {followUps.length === 0 ? (
        <View style={styles.emptyBoxSmall}>
          <Text style={styles.emptyText}>Sin seguimientos registrados.</Text>
        </View>
      ) : (
        followUps.map((f) => <FollowUpRow key={f.id} item={f} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.background },
  header: { alignItems: "center", marginBottom: 20 },
  avatarPlaceholder: {
    width: 84, height: 84, borderRadius: 42, marginBottom: 12,
    backgroundColor: colors.cardAlt, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontSize: 30, fontWeight: "800" },
  name: { fontSize: 19, fontWeight: "800", color: colors.text, textAlign: "center" },
  stagePill: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  stagePillText: { fontSize: 11.5, fontWeight: "700" },
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
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: colors.muted,
    textTransform: "uppercase", letterSpacing: 0.5, marginTop: 24, marginBottom: 10,
  },
  followUpRow: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 12, marginBottom: 10,
  },
  followUpHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  followUpType: { fontSize: 13.5, fontWeight: "700", color: colors.text },
  followUpDate: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  followUpNotes: { fontSize: 12.5, color: colors.text, marginTop: 6, lineHeight: 18 },
  resultPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  resultPillText: { fontSize: 10, fontWeight: "700" },
  emptyBoxSmall: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 16, alignItems: "center",
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
});
