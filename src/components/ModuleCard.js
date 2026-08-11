import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

// Tarjeta de módulo en la grilla de inicio. `comingSoon` la deja tocable
// pero sin acción y con menos contraste — así la pantalla se siente como la
// de una app con varios módulos, no un menú de una sola opción, sin
// prometer algo que todavía no funciona.
export default function ModuleCard({ icon, iconColor, title, subtitle, comingSoon, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, comingSoon && styles.cardDisabled]}
      onPress={comingSoon ? undefined : onPress}
      activeOpacity={comingSoon ? 1 : 0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: (comingSoon ? colors.muted : iconColor) + "22" }]}>
        <Ionicons name={icon} size={22} color={comingSoon ? colors.muted : iconColor} />
      </View>
      <Text style={[styles.title, comingSoon && styles.mutedText]} numberOfLines={1}>{title}</Text>
      <Text style={[styles.subtitle, comingSoon && styles.mutedText]} numberOfLines={2}>
        {comingSoon ? "Próximamente" : subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "47%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  cardDisabled: { opacity: 0.55 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: { color: colors.text, fontSize: 14, fontWeight: "700", textAlign: "center" },
  subtitle: { color: colors.muted, fontSize: 11.5, marginTop: 3, lineHeight: 15, textAlign: "center" },
  mutedText: { color: colors.muted },
});
