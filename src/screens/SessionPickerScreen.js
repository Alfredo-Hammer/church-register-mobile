import { useEffect, useState } from "react";
import { View, Text, SectionList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { conferenceService } from "../services/api";
import { colors } from "../theme";

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

export default function SessionPickerScreen({ route, navigation }) {
  const { conferenceId, conferenceName } = route.params;
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: conferenceName });
    conferenceService.getById(conferenceId)
      .then((data) => {
        setSections(
          data.days.map((day) => ({
            title: `Día ${day.day_number}`,
            data: day.sessions,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conferenceId, conferenceName, navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={sections.length === 0 && styles.center}
      ListEmptyComponent={<Text style={styles.empty}>Esta conferencia no tiene sesiones todavía</Text>}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Scanner", { sessionId: item.id, sessionTitle: item.title })}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.time_start && (
            <Text style={styles.cardSubtitle}>
              {formatTime(item.time_start)}{item.time_end ? ` – ${formatTime(item.time_end)}` : ""}
            </Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { color: colors.muted, fontSize: 14 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.muted, marginTop: 3 },
});
