import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { membersService } from "../services/api";
import { colors, MEMBER_STATUS_META } from "../theme";

const GENDER_LABELS = { MASCULINO: "Masculino", FEMENINO: "Femenino", OTRO: "Otro" };
const AGE_GROUP_LABELS = { ADULTO: "Adulto", JOVEN: "Joven", NIÑO: "Niño" };
const MARITAL_LABELS = {
  SOLTERO: "Soltero/a", CASADO: "Casado/a", DIVORCIADO: "Divorciado/a",
  VIUDO: "Viudo/a", UNION_LIBRE: "Unión libre",
};

function formatDate(d) {
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function calcAge(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
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

// Vista de solo lectura — crear/editar sigue siendo cosa de la web por
// ahora. Esto es lo que faltaba: antes no había ninguna forma de ver el
// detalle de un miembro desde la app.
export default function MemberDetailScreen({ route }) {
  const { memberId } = route.params;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await membersService.getById(memberId);
        setMember(data);
      } catch {
        setError("No se pudo cargar el miembro.");
      }
      setLoading(false);
    })();
  }, [memberId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !member) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={22} color={colors.muted} />
        <Text style={styles.emptyText}>{error || "Miembro no encontrado."}</Text>
      </View>
    );
  }

  const status = MEMBER_STATUS_META[member.status] || { label: member.status, color: colors.muted };
  const initial = (member.first_name?.charAt(0) || "?").toUpperCase();
  const age = calcAge(member.birth_date);
  const guardianName = member.guardian_first_name
    ? `${member.guardian_first_name} ${member.guardian_last_name}`
    : member.guardian_name;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {member.photo_url ? (
          <Image source={{ uri: member.photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <Text style={styles.name}>{member.first_name} {member.last_name}</Text>
        <View style={[styles.statusPill, { backgroundColor: `${status.color}22` }]}>
          <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <InfoRow icon="call-outline" label="Teléfono" value={member.phone} />
        <InfoRow icon="mail-outline" label="Correo" value={member.email} />
        <InfoRow icon="location-outline" label="Dirección" value={member.address} />
        <InfoRow
          icon="calendar-outline"
          label="Fecha de nacimiento"
          value={member.birth_date ? `${new Date(member.birth_date).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}${age !== null ? ` (${age} años)` : ""}` : null}
        />
        <InfoRow icon="person-outline" label="Sexo" value={GENDER_LABELS[member.gender]} />
        <InfoRow icon="time-outline" label="Miembro desde" value={member.member_since ? formatDate(member.member_since) : null} />
        <InfoRow icon="card-outline" label="Documento de identidad" value={member.document_id} />
        <InfoRow icon="heart-outline" label="Estado civil" value={MARITAL_LABELS[member.marital_status]} />
        <InfoRow icon="briefcase-outline" label="Ocupación" value={member.occupation} />
        <InfoRow icon="people-outline" label="Grupo etario" value={AGE_GROUP_LABELS[member.age_group]} />
        <InfoRow icon="school-outline" label="Grado" value={member.grade} />
        <InfoRow icon="person-circle-outline" label="Encargado/Tutor" value={guardianName} />
        <InfoRow icon="medkit-outline" label="Alergias" value={member.allergies} />
        <InfoRow icon="alert-circle-outline" label="Contacto de emergencia" value={member.emergency_contact} />
      </View>

      {member.pastor_notes ? (
        <View style={styles.notesCard}>
          <View style={styles.metaLineRow}>
            <Ionicons name="book-outline" size={14} color={colors.primary} />
            <Text style={styles.notesLabel}>Notas pastorales</Text>
          </View>
          <Text style={styles.notesText}>{member.pastor_notes}</Text>
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
  emptyText: { color: colors.muted, fontSize: 13, textAlign: "center" },
});
