import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { baptismsService } from "../services/api";
import { colors } from "../theme";

const GENDER_LABELS = { MASCULINO: "Masculino", FEMENINO: "Femenino", OTRO: "Otro" };

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

// Vista de solo lectura, mismo criterio que MemberDetailScreen: registrar
// o editar un bautismo sigue siendo cosa de la web.
export default function BaptismDetailScreen({ route }) {
  const { baptismId } = route.params;
  const [baptism, setBaptism] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await baptismsService.getById(baptismId);
        setBaptism(data.baptism);
      } catch {
        setError("No se pudo cargar el bautismo.");
      }
      setLoading(false);
    })();
  }, [baptismId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !baptism) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={22} color={colors.muted} />
        <Text style={styles.emptyText}>{error || "Bautismo no encontrado."}</Text>
      </View>
    );
  }

  const initial = (baptism.first_name?.charAt(0) || "?").toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{baptism.first_name} {baptism.last_name}</Text>
        <View style={styles.datePill}>
          <Ionicons name="water-outline" size={13} color={colors.primary} />
          <Text style={styles.datePillText}>{formatLongDate(baptism.baptism_date)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <InfoRow icon="person-outline" label="Ministro" value={baptism.minister} />
        <InfoRow icon="location-outline" label="Lugar" value={baptism.place} />
        <InfoRow icon="call-outline" label="Teléfono" value={baptism.phone} />
        <InfoRow
          icon="calendar-outline"
          label="Fecha de nacimiento"
          value={baptism.birth_date ? formatLongDate(baptism.birth_date) : null}
        />
        <InfoRow icon="male-female-outline" label="Sexo" value={GENDER_LABELS[baptism.gender]} />
        <InfoRow icon="home-outline" label="Dirección" value={baptism.address} />
      </View>
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
  datePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, backgroundColor: `${colors.primary}22`,
  },
  datePillText: { fontSize: 11.5, fontWeight: "700", color: colors.primary },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 16, gap: 14,
  },
  infoRow: { flexDirection: "row", gap: 10 },
  infoLabel: { fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, color: colors.text, marginTop: 2 },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: "center" },
});
