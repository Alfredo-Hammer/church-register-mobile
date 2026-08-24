import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme";

// Banner para el video de la iglesia en el Inicio. Dos modos, según lo que
// haya configurado el admin/pastor desde Configuración → Iglesia:
// - liveStreamUrl: transmisión en vivo ahora mismo (rojo, "EN VIVO AHORA").
// - si no, defaultVideoUrl: video de respaldo (p. ej. el último culto
//   grabado) para que siempre haya algo del video de la iglesia disponible.
// Tocarlo abre el video embebido a pantalla completa (LiveStreamScreen).
export default function LiveStreamBanner({ liveStreamUrl, defaultVideoUrl }) {
  const navigation = useNavigation();
  const isLive = !!liveStreamUrl;
  const url = liveStreamUrl || defaultVideoUrl;
  if (!url) return null;

  return (
    <TouchableOpacity
      style={[styles.banner, !isLive && styles.bannerDefault]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate("LiveStream", { streamUrl: url })}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="play" size={16} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        {isLive && (
          <View style={styles.labelRow}>
            <View style={styles.dot} />
            <Text style={styles.label}>EN VIVO AHORA</Text>
          </View>
        )}
        <Text style={styles.title}>{isLive ? "Ver la transmisión" : "Ver video de la iglesia"}</Text>
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
  bannerDefault: { backgroundColor: colors.primary },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },
  label: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  title: { color: "#fff", fontSize: 15, fontWeight: "700", marginTop: 2 },
});
