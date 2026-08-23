import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, EVENT_TYPE_META } from "../theme";

// Banner "EN VIVO AHORA" — evento u ocurrencia de oración que está pasando
// en este momento (ver isEventLiveNow/isPrayerLiveNow/pickLiveNow en
// schedule.js). Compartido entre el home de miembro y el de staff.
export default function LiveNowBanner({ item }) {
  if (!item) return null;
  const isPrayer = item.kind === "prayer";
  const meta = EVENT_TYPE_META[item.event_type] || { label: "Oración" };
  return (
    <View style={styles.banner}>
      <View style={styles.dot} />
      <View style={{ flex: 1 }}>
        <View style={styles.labelRow}>
          <Text style={styles.liveLabel}>EN VIVO AHORA</Text>
          <Text style={styles.typeLabel}>{isPrayer ? "Oración" : meta.label}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>{item.title || item.name}</Text>
        {item.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.location}>{item.location}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: colors.danger, borderRadius: 16, padding: 14,
  },
  dot: {
    width: 9, height: 9, borderRadius: 5, backgroundColor: "#fff", marginTop: 5,
  },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  liveLabel: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  typeLabel: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700" },
  title: { color: "#fff", fontSize: 16, fontWeight: "800", marginTop: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  location: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
});
