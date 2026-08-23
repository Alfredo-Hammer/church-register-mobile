import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Chip de acceso rápido para headers con degradado (fondo translúcido
// blanco) — usado tanto en el home de miembro como en el de staff.
export default function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Ionicons name={icon} size={16} color="#fff" />
      <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  quickAction: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  quickActionText: { color: "#fff", fontSize: 12.5, fontWeight: "600" },
});
