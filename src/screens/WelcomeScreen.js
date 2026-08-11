import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

// Primera pantalla sin sesión — separa los dos públicos bien distintos de
// la app: el equipo (login normal, ya tiene cuenta) y un miembro común, que
// hoy no tiene cuenta y se asocia a su iglesia con el código de invitación
// que el pastor comparte (ver Configuración → Iglesia en el panel web).
export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logoCircle}>
          <Ionicons name="home" size={28} color="#fff" />
        </View>
        <Text style={styles.title}>Congrega</Text>
        <Text style={styles.subtitle}>Tu iglesia, en un solo lugar</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("JoinChurch")}>
          <Ionicons name="people-outline" size={18} color={colors.primaryText} />
          <Text style={styles.primaryButtonText}>Soy miembro de una iglesia</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Login")}>
          <Ionicons name="briefcase-outline" size={18} color={colors.text} />
          <Text style={styles.secondaryButtonText}>Soy parte del equipo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brand: { alignItems: "center", marginBottom: 56 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4 },
  actions: { gap: 12 },
  primaryButton: {
    flexDirection: "row", gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center", justifyContent: "center",
  },
  primaryButtonText: { color: colors.primaryText, fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    flexDirection: "row", gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center", justifyContent: "center",
  },
  secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: "600" },
});
