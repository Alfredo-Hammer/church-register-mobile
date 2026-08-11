import { useCallback, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { announcementsService } from "../services/api";
import { markAnnouncementsSeen } from "../utils/announcementsSeen";
import { colors } from "../theme";

const CAN_DELETE_ROLES = ["ADMIN", "PASTOR"];
const CAN_CREATE_ROLES = ["ADMIN", "PASTOR", "LIDER"];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function AnnouncementCard({ item, canDelete, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        {canDelete && (
          <TouchableOpacity onPress={() => onDelete(item)} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.cardBody}>{item.body}</Text>
      <View style={styles.cardFooter}>
        <Ionicons name="time-outline" size={12} color={colors.muted} />
        <Text style={styles.cardDate}>
          {formatDate(item.created_at)}
          {item.created_by_name ? ` · ${item.created_by_name}` : ""}
        </Text>
      </View>
    </View>
  );
}

// Pantalla de staff: listar, publicar y borrar avisos. El mismo contenido
// se muestra sin edición en el dashboard de miembro, vía el endpoint
// público scoped por church_id (ver publicService.getAnnouncements).
export default function AnnouncementsScreen() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canDelete = CAN_DELETE_ROLES.includes(user?.role);
  const canCreate = CAN_CREATE_ROLES.includes(user?.role);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await announcementsService.getAll();
      setAnnouncements(data.announcements || []);
      if (data.announcements?.[0]) markAnnouncementsSeen(data.announcements[0].created_at);
    } catch {
      setError("No se pudieron cargar los avisos.");
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setError("");
    try {
      await announcementsService.create(title.trim(), body.trim());
      setTitle("");
      setBody("");
      setShowForm(false);
      await load();
    } catch {
      setError("No se pudo publicar el aviso. Intenta de nuevo.");
    }
    setSaving(false);
  };

  const handleDelete = (item) => {
    Alert.alert("Eliminar aviso", `¿Eliminar "${item.title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await announcementsService.remove(item.id);
            setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
          } catch {
            Alert.alert("Error", "No se pudo eliminar el aviso.");
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AnnouncementCard item={item} canDelete={canDelete} onDelete={handleDelete} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        ListHeaderComponent={
          !canCreate ? null : showForm ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Título"
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
                maxLength={200}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mensaje"
                placeholderTextColor={colors.muted}
                value={body}
                onChangeText={setBody}
                multiline
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowForm(false); setError(""); }}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.publishButton, (!title.trim() || !body.trim() || saving) && styles.buttonDisabled]}
                  onPress={handleCreate}
                  disabled={!title.trim() || !body.trim() || saving}
                >
                  {saving ? <ActivityIndicator color={colors.primaryText} size="small" /> : <Text style={styles.publishButtonText}>Publicar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.newButton} onPress={() => setShowForm(true)}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.newButtonText}>Nuevo aviso</Text>
            </TouchableOpacity>
          )
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="megaphone-outline" size={22} color={colors.muted} />
              <Text style={styles.emptyText}>Todavía no hay avisos publicados.</Text>
            </View>
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  newButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed",
    borderRadius: 12, paddingVertical: 12, marginBottom: 14,
  },
  newButtonText: { color: colors.primary, fontSize: 13.5, fontWeight: "700" },
  form: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 14, marginBottom: 14, gap: 10,
  },
  input: {
    backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    color: colors.text, fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  error: { color: colors.danger, fontSize: 12 },
  formActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 14 },
  cancelButtonText: { color: colors.muted, fontSize: 13.5, fontWeight: "600" },
  publishButton: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 },
  buttonDisabled: { opacity: 0.5 },
  publishButtonText: { color: colors.primaryText, fontSize: 13.5, fontWeight: "700" },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 14, marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  cardBody: { fontSize: 13, color: colors.text, marginTop: 8, lineHeight: 19 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  cardDate: { fontSize: 11.5, color: colors.muted },
  emptyBox: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 24, marginTop: 12,
  },
  emptyText: { color: colors.muted, fontSize: 12.5, textAlign: "center" },
});
