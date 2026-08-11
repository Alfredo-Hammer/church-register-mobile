import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { eventsService, membersService } from "../services/api";
import { colors } from "../theme";

export default function AttendanceScreen({ route, navigation }) {
  const { eventId, eventTitle } = route.params;
  const [members, setMembers] = useState([]);
  // record.id (attendance.id) por member_id — hace falta guardar el id del
  // registro, no solo si está marcado, porque borrar exige el attendance.id
  // y no el member_id (así lo pide el endpoint DELETE, aunque el nombre del
  // parámetro de ruta diga lo contrario).
  const [originalRecords, setOriginalRecords] = useState(new Map());
  const [selected, setSelected] = useState(new Set());
  const [guestCount, setGuestCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: eventTitle });
  }, [eventTitle, navigation]);

  useEffect(() => {
    (async () => {
      try {
        const [membersData, attendanceData, eventData] = await Promise.all([
          membersService.getAll({ limit: 1000, status: "ACTIVO" }),
          eventsService.getAttendance(eventId),
          eventsService.getById(eventId),
        ]);
        setMembers(membersData.members);
        // Sin esto el contador siempre arrancaba en 0 — si nadie tocaba el
        // stepper, "Guardar" terminaba pisando el valor real con 0 en vez
        // de dejarlo como estaba.
        setGuestCount(eventData.event?.guest_count ?? eventData.guestCount ?? 0);

        const recordsMap = new Map();
        const selectedIds = new Set();
        attendanceData.attendees.forEach((a) => {
          recordsMap.set(a.member_id, a.id);
          selectedIds.add(a.member_id);
        });
        setOriginalRecords(recordsMap);
        setSelected(selectedIds);
      } catch {
        setError("No se pudo cargar la lista de miembros.");
      }
      setLoading(false);
    })();
  }, [eventId]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(q)
    );
  }, [members, search]);

  const toggleMember = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredMembers.forEach((m) => next.add(m.id));
      return next;
    });
  };

  const clearAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredMembers.forEach((m) => next.delete(m.id));
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      // Mismo diseño que la web: solo se manda lo que cambió, no toda la
      // lista — agregar en lote lo nuevo, borrar uno por uno lo quitado.
      const toAdd = [...selected].filter((id) => !originalRecords.has(id));
      const toRemove = [...originalRecords.entries()].filter(([id]) => !selected.has(id));

      await Promise.all([
        toAdd.length > 0 ? eventsService.recordBulkAttendance(eventId, toAdd) : Promise.resolve(),
        ...toRemove.map(([, attendanceId]) => eventsService.deleteAttendance(eventId, attendanceId)),
        eventsService.updateGuestCount(eventId, guestCount),
      ]);

      const attendanceData = await eventsService.getAttendance(eventId);
      const recordsMap = new Map();
      attendanceData.attendees.forEach((a) => recordsMap.set(a.member_id, a.id));
      setOriginalRecords(recordsMap);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo guardar la asistencia.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar miembro…"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.quickRow}>
        <TouchableOpacity onPress={selectAllVisible}><Text style={styles.quickLink}>Todos</Text></TouchableOpacity>
        <TouchableOpacity onPress={clearAllVisible}><Text style={styles.quickLink}>Ninguno</Text></TouchableOpacity>
        <Text style={styles.quickCount}>{selected.size} de {members.length} marcados</Text>
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Sin resultados</Text>}
        renderItem={({ item }) => {
          const checked = selected.has(item.id);
          return (
            <TouchableOpacity style={styles.row} onPress={() => toggleMember(item.id)}>
              <View style={styles.rowLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.first_name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.rowName}>{item.first_name} {item.last_name}</Text>
                  {item.phone && <Text style={styles.rowPhone}>{item.phone}</Text>}
                </View>
              </View>
              <Ionicons
                name={checked ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={checked ? colors.success : colors.border}
              />
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.guestRow}>
          <Text style={styles.guestLabel}>Visitantes / público general</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setGuestCount((v) => Math.max(0, v - 1))}
            >
              <Ionicons name="remove" size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{guestCount}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setGuestCount((v) => v + 1)}
            >
              <Ionicons name="add" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {saved ? <Text style={styles.savedText}>Asistencia guardada ✓</Text> : null}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color={colors.primaryText} />
            : <Text style={styles.saveButtonText}>Guardar asistencia</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 10, fontSize: 14 },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  quickLink: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  quickCount: { color: colors.muted, fontSize: 12, marginLeft: "auto" },
  list: { flex: 1, paddingHorizontal: 16 },
  empty: { color: colors.muted, fontSize: 14, marginTop: 20, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.cardAlt,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  rowName: { color: colors.text, fontSize: 14, fontWeight: "500" },
  rowPhone: { color: colors.muted, fontSize: 12, marginTop: 2 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    backgroundColor: colors.card,
  },
  guestRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  guestLabel: { color: colors.text, fontSize: 13, flexShrink: 1 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepperButton: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.cardAlt,
    alignItems: "center", justifyContent: "center",
  },
  stepperValue: { color: colors.text, fontSize: 15, fontWeight: "700", minWidth: 20, textAlign: "center" },
  error: { color: colors.danger, fontSize: 12.5, marginBottom: 8 },
  savedText: { color: colors.success, fontSize: 12.5, marginBottom: 8, fontWeight: "600" },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveButtonText: { color: colors.primaryText, fontSize: 14, fontWeight: "700" },
});
