import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

// Barras dibujadas con Views puros (ancho proporcional al valor) en vez de
// una librería de gráficos — no hay ninguna otra dependencia de charts en
// la app, y esto cubre lo que necesita un vistazo rápido sin agregar peso.
export default function SimpleBarChart({ data = [], money = false }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  const fmt = (v) =>
    money
      ? "$" + Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })
      : Number(v || 0).toLocaleString("en-US");

  return (
    <View style={styles.container}>
      {data.map((d) => (
        <View key={d.label} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>{d.label}</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max(4, (d.value / max) * 100)}%`, backgroundColor: d.color || colors.primary },
              ]}
            />
          </View>
          <Text style={styles.value}>{fmt(d.value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { width: 78, fontSize: 11.5, color: colors.muted },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.cardAlt, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5 },
  value: { width: 56, fontSize: 11.5, fontWeight: "700", color: colors.text, textAlign: "right" },
});
