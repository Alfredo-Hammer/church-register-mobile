import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

// Punto de entrada — por ahora un solo módulo (check-in de conferencia, el
// caso donde la app nativa gana frente a la web: cámara directa, sin el
// rodeo de HTTPS+LAN que necesita el navegador). El resto de los módulos
// (Asistencia, Visitantes, Miembros) se agregan aquí cuando se construyan,
// mismo patrón de tarjeta.
export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.greeting}>Hola, {user?.fullName?.split(" ")[0] || "—"}</Text>
        <Text style={styles.church}>{user?.churchName}</Text>
      </View>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ConferenceList")}
      >
        <Text style={styles.cardTitle}>Check-in de Conferencia</Text>
        <Text style={styles.cardSubtitle}>Escanear gafetes por sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: "space-between",
  },
  greeting: { fontSize: 22, fontWeight: "700", color: colors.text },
  church: { fontSize: 13, color: colors.muted, marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 18,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  cardSubtitle: { fontSize: 13, color: colors.muted, marginTop: 4 },
  logout: { alignItems: "center", paddingVertical: 14 },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: "600" },
});
