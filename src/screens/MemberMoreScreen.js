import { View, Text, TouchableOpacity, ScrollView, Linking, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

function openPhone(phone) {
  Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`);
}

function openMaps(address) {
  const query = encodeURIComponent(address);
  const url = Platform.OS === "ios" ? `maps:0,0?q=${query}` : `geo:0,0?q=${query}`;
  Linking.openURL(url).catch(() => Linking.openURL(`https://maps.google.com/?q=${query}`));
}

function openWebsite(website) {
  const url = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  Linking.openURL(url);
}

function Row({ icon, label, sub, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
        {sub ? <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </TouchableOpacity>
  );
}

// Pestaña "Más" — todo lo que no encaja en Inicio/Calendario: Grupos, datos
// de contacto de la iglesia (antes vivían como chips en el header de
// Inicio, ahora tienen su propio lugar), y cambiar de iglesia.
export default function MemberMoreScreen({ navigation }) {
  const { joinedChurch, leaveChurch } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Iglesia</Text>
        <View style={styles.card}>
          <Row icon="people-circle-outline" label="Grupos y ministerios" onPress={() => navigation.navigate("Groups")} />
        </View>
      </View>

      {(joinedChurch?.phone || joinedChurch?.address || joinedChurch?.website) && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Contacto</Text>
          <View style={styles.card}>
            {joinedChurch?.phone && (
              <Row icon="call-outline" label="Llamar" sub={joinedChurch.phone} onPress={() => openPhone(joinedChurch.phone)} />
            )}
            {joinedChurch?.address && (
              <Row icon="navigate-outline" label="Cómo llegar" sub={joinedChurch.address} onPress={() => openMaps(joinedChurch.address)} />
            )}
            {joinedChurch?.website && (
              <Row icon="globe-outline" label="Sitio web" sub={joinedChurch.website} onPress={() => openWebsite(joinedChurch.website)} />
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.card}>
          <Row icon="swap-horizontal-outline" label="Cambiar de iglesia" onPress={leaveChurch} danger />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 22 },
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: colors.muted,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
  },
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
  rowIconDanger: { backgroundColor: `${colors.danger}1a` },
  rowLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
});
