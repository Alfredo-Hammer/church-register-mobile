import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { publicService } from "../services/api";
import { colors } from "../theme";

function formatSermonDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr.slice(0, 10) + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function SermonRow({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.thumb}>
        <Ionicons name="play" size={16} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[item.speaker, formatSermonDate(item.sermon_date)].filter(Boolean).join(" · ")}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Pestaña "Mensajes" — prédicas pasadas, mismo mecanismo de embed que la
// transmisión en vivo (link de Facebook → LiveStreamScreen). Cada iglesia
// carga sus propias prédicas desde Configuración → web.
export default function MemberMessagesScreen({ navigation }) {
  const { joinedChurch } = useAuth();
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!joinedChurch?.id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await publicService.getSermons(joinedChurch.id);
      setSermons(data.sermons || []);
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
      {sermons.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="book-outline" size={22} color={colors.muted} />
          <Text style={styles.emptyText}>Todavía no hay prédicas publicadas.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {sermons.map((s) => (
            <SermonRow
              key={s.id}
              item={s}
              onPress={() => navigation.navigate("LiveStream", { streamUrl: s.video_url })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  thumb: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "700", color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2, textTransform: "capitalize" },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24,
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
});
