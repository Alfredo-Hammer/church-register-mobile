import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme";

// Banner para cuando el admin/pastor pegó un link de transmisión en vivo
// desde Configuración → Iglesia (ver settingsController.updateLiveStream).
// Tocarlo abre el video embebido a pantalla completa (LiveStreamScreen).
export default function LiveStreamBanner({ liveStreamUrl }) {
  const navigation = useNavigation();
  if (!liveStreamUrl) return null;

  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.85}
      onPress={() => navigation.navigate("LiveStream", { streamUrl: liveStreamUrl })}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="play" size={16} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.labelRow}>
          <View style={styles.dot} />
          <Text style={styles.label}>EN VIVO AHORA</Text>
        </View>
        <Text style={styles.title}>Ver la transmisión</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.danger, borderRadius: 16, padding: 14,
  },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },
  label: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  title: { color: "#fff", fontSize: 15, fontWeight: "700", marginTop: 2 },
});
