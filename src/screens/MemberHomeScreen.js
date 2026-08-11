import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

// Landing placeholder para un miembro que ya redimió su código de
// invitación. El dashboard real (eventos, autoregistro a conferencias,
// historial de asistencia, grupos, oración) es una fase aparte, todavía sin
// empezar — esto solo cierra el loop de "unirme a mi iglesia" con algo que
// confirma que funcionó y deja la puerta abierta a salir.
export default function MemberHomeScreen() {
  const { joinedChurch, leaveChurch } = useAuth();

  return (
    <View style={styles.container}>
      {joinedChurch?.logoUrl ? (
        <Image source={{ uri: joinedChurch.logoUrl }} style={styles.logo} />
      ) : (
        <View style={styles.logoPlaceholder}>
          <Ionicons name="home" size={32} color={colors.muted} />
        </View>
      )}
      <Text style={styles.churchName}>{joinedChurch?.name}</Text>
      <Text style={styles.subtitle}>Ya formas parte de esta iglesia en Congrega.</Text>

      <View style={styles.comingSoon}>
        <Ionicons name="construct-outline" size={18} color={colors.muted} />
        <Text style={styles.comingSoonText}>
          Muy pronto: eventos, avisos y tu historial de asistencia.
        </Text>
      </View>

      <TouchableOpacity style={styles.leaveButton} onPress={leaveChurch}>
        <Text style={styles.leaveButtonText}>No es mi iglesia — salir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 },
  logo: { width: 84, height: 84, borderRadius: 20, marginBottom: 16 },
  logoPlaceholder: {
    width: 84, height: 84, borderRadius: 20, marginBottom: 16,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  churchName: { fontSize: 22, fontWeight: "800", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 6, textAlign: "center" },
  comingSoon: {
    flexDirection: "row", gap: 8, alignItems: "center",
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginTop: 32,
  },
  comingSoonText: { color: colors.muted, fontSize: 12.5, flex: 1 },
  leaveButtonText: { color: colors.danger, fontSize: 13, fontWeight: "600" },
  leaveButton: { marginTop: 40, padding: 8 },
});
