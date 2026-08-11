import { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { conferenceService } from "../services/api";
import { colors } from "../theme";

// Mismo cooldown que la versión web: mientras el gafete siga frente a la
// cámara, no hay que reenviar la misma petición en cada frame.
const RESCAN_COOLDOWN_MS = 4000;

export default function ScannerScreen({ route, navigation }) {
  const { sessionId, sessionTitle } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOn, setCameraOn] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { kind: 'ok'|'warn'|'error', text }
  const [attendance, setAttendance] = useState([]);
  const [total, setTotal] = useState(0);
  const lastScanRef = useRef({ token: null, at: 0 });

  useEffect(() => {
    navigation.setOptions({ title: sessionTitle });
  }, [sessionTitle, navigation]);

  const fetchAttendance = useCallback(async () => {
    try {
      const data = await conferenceService.getSessionAttendance(sessionId);
      setAttendance(data.attendance);
      setTotal(data.total);
    } catch { /* silencioso */ }
  }, [sessionId]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(t);
  }, [feedback]);

  const handleScan = useCallback(async (rawToken, fromCamera = false) => {
    const token = rawToken.trim();
    if (!token || submitting) return;

    const now = Date.now();
    if (fromCamera && lastScanRef.current.token === token && now - lastScanRef.current.at < RESCAN_COOLDOWN_MS) {
      return;
    }
    lastScanRef.current = { token, at: now };

    setSubmitting(true);
    try {
      const data = await conferenceService.checkIn(token, sessionId);
      setFeedback({
        kind: data.alreadyCheckedIn ? "warn" : "ok",
        text: data.alreadyCheckedIn
          ? `${data.attendee.fullName} ya estaba registrado`
          : `${data.attendee.fullName} — asistencia registrada`,
      });
      fetchAttendance();
    } catch (err) {
      setFeedback({ kind: "error", text: err.response?.data?.error || "No se pudo registrar." });
    }
    setSubmitting(false);
  }, [sessionId, submitting, fetchAttendance]);

  const handleManualSubmit = () => {
    handleScan(manualToken);
    setManualToken("");
  };

  const toggleCamera = async () => {
    if (!cameraOn && !permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setCameraOn((v) => !v);
  };

  const feedbackColor = feedback?.kind === "ok" ? colors.success
    : feedback?.kind === "warn" ? colors.warning
    : colors.danger;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>{total} registrados</Text>
      </View>

      {feedback && (
        <View style={[styles.feedback, { borderColor: feedbackColor, backgroundColor: feedbackColor + "22" }]}>
          <Text style={[styles.feedbackText, { color: feedbackColor }]}>{feedback.text}</Text>
        </View>
      )}

      <View style={styles.cameraBox}>
        {cameraOn ? (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => handleScan(data, true)}
          />
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.placeholderText}>Activa la cámara para escanear los gafetes</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.button} onPress={toggleCamera}>
        <Text style={styles.buttonText}>{cameraOn ? "Detener cámara" : "Activar cámara"}</Text>
      </TouchableOpacity>

      <View style={styles.manualRow}>
        <TextInput
          style={styles.input}
          placeholder="PIN de 6 dígitos o código del gafete"
          placeholderTextColor={colors.muted}
          value={manualToken}
          onChangeText={setManualToken}
          onSubmitEditing={handleManualSubmit}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.manualButton, (!manualToken.trim() || submitting) && styles.buttonDisabled]}
          onPress={handleManualSubmit}
          disabled={!manualToken.trim() || submitting}
        >
          {submitting ? <ActivityIndicator color={colors.primaryText} size="small" /> : <Text style={styles.buttonText}>Marcar</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.listTitle}>Registrados en esta sesión</Text>
      <FlatList
        data={attendance}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aún nadie ha sido registrado</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowName}>{item.full_name}</Text>
            <Text style={styles.rowTime}>
              {new Date(item.checked_in_at).toLocaleTimeString("es", { hour: "numeric", minute: "2-digit" })}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 },
  count: { color: colors.text, fontWeight: "700", fontSize: 14 },
  feedback: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  feedbackText: { fontWeight: "600", fontSize: 13 },
  cameraBox: {
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
    aspectRatio: 1,
  },
  camera: { flex: 1 },
  cameraPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  placeholderText: { color: colors.muted, textAlign: "center", fontSize: 13 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.primaryText, fontWeight: "600", fontSize: 14 },
  manualRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 14,
  },
  manualButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  listTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 8,
  },
  list: { flex: 1 },
  empty: { color: colors.muted, fontSize: 13 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowName: { color: colors.text, fontSize: 14 },
  rowTime: { color: colors.muted, fontSize: 12 },
});
