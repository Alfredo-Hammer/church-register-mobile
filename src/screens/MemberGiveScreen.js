import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Linking, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { publicService } from "../services/api";
import { colors } from "../theme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s()-]{7,}$/;

// No todos los "value" son links abribles (un correo de Zelle es solo
// información para copiar/anotar, no un link real) — se decide acá qué
// hacer al tocar la fila según el formato, en vez de asumir que todo es
// una URL.
function resolveAction(value) {
  if (/^https?:\/\//i.test(value)) return () => Linking.openURL(value);
  if (EMAIL_RE.test(value)) return () => Linking.openURL(`mailto:${value}`);
  if (PHONE_RE.test(value)) return () => Linking.openURL(`tel:${value.replace(/[^\d+]/g, "")}`);
  return null;
}

function GivingRow({ item }) {
  const action = resolveAction(item.value);
  return (
    <TouchableOpacity style={styles.row} onPress={action || undefined} activeOpacity={action ? 0.7 : 1}>
      <View style={styles.rowIcon}>
        <Ionicons name="heart-outline" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>{item.value}</Text>
      </View>
      {action ? <Ionicons name="open-outline" size={18} color={colors.muted} /> : null}
    </TouchableOpacity>
  );
}

// Pestaña "Dar" — la app nunca procesa pagos, solo muestra cómo dar (link
// al sitio, Zelle, Cashapp, etc.) y abre lo que corresponda al tocar.
// Cada iglesia carga sus propias formas de dar desde Configuración → web.
export default function MemberGiveScreen() {
  const { joinedChurch } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!joinedChurch?.id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await publicService.getGivingLinks(joinedChurch.id);
      setLinks(data.givingLinks || []);
    } catch { /* silencioso */ }
    setLoading(false);
    setRefreshing(false);
  }, [joinedChurch?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
    >
      <Text style={styles.intro}>Gracias por apoyar a {joinedChurch?.name || "tu iglesia"}.</Text>

      {links.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="heart-outline" size={22} color={colors.muted} />
          <Text style={styles.emptyText}>Todavía no hay formas de dar publicadas.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {links.map((item) => <GivingRow key={item.id} item={item} />)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  intro: { color: colors.muted, fontSize: 13, marginBottom: 16 },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: `${colors.primary}1a`,
    alignItems: "center", justifyContent: "center",
  },
  rowLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowValue: { fontSize: 12, color: colors.muted, marginTop: 1 },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24,
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
});
