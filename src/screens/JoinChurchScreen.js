import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { publicService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

// Inserta el guion automáticamente (XXXX-XXXX) para que quien lo escribe a
// mano no tenga que acordarse de teclearlo — mismo formato que genera el
// backend.
function formatCodeInput(raw) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

export default function JoinChurchScreen({ navigation }) {
  const { joinChurch } = useAuth();
  const [code, setCode] = useState("");
  const [resolvedChurch, setResolvedChurch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedOnce, setScannedOnce] = useState(false);

  const resolveCode = async (rawCode) => {
    const value = rawCode.trim();
    if (value.length < 9) {
      setError("Ese código no se ve completo (formato XXXX-XXXX).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await publicService.resolveJoinCode(value);
      setResolvedChurch(data.church);
      setScanning(false);
    } catch (err) {
      setError(err.response?.data?.error || "Código no encontrado. Revísalo con quien te lo compartió.");
    }
    setLoading(false);
  };

  const handleScanned = ({ data }) => {
    if (scannedOnce) return;
    setScannedOnce(true);
    setCode(data);
    resolveCode(data).finally(() => setScannedOnce(false));
  };

  const toggleScanner = async () => {
    if (!scanning && !permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setScanning((v) => !v);
  };

  const handleConfirm = async () => {
    await joinChurch(resolvedChurch);
    // No hace falta navegar a mano: RootNavigator cambia de stack solo en
    // cuanto `joinedChurch` deja de ser null.
  };

  if (resolvedChurch) {
    return (
      <View style={styles.container}>
        <View style={styles.confirmCard}>
          {resolvedChurch.logoUrl ? (
            <Image source={{ uri: resolvedChurch.logoUrl }} style={styles.churchLogo} />
          ) : (
            <View style={styles.churchLogoPlaceholder}>
              <Ionicons name="home" size={28} color={colors.muted} />
            </View>
          )}
          <Text style={styles.confirmLabel}>Te vas a unir a</Text>
          <Text style={styles.churchName}>{resolvedChurch.name}</Text>
          {resolvedChurch.city && <Text style={styles.churchCity}>{resolvedChurch.city}</Text>}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm}>
          <Text style={styles.primaryButtonText}>Confirmar y unirme</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={() => { setResolvedChurch(null); setCode(""); }}>
          <Text style={styles.linkButtonText}>No es esta — probar otro código</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Únete a tu iglesia</Text>
      <Text style={styles.subtitle}>Pídele el código de invitación a tu pastor o líder.</Text>

      {scanning ? (
        <View style={styles.cameraBox}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleScanned}
          />
        </View>
      ) : (
        <TextInput
          style={styles.codeInput}
          placeholder="XXXX-XXXX"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          value={code}
          onChangeText={(v) => setCode(formatCodeInput(v))}
          maxLength={9}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!scanning && (
        <TouchableOpacity
          style={[styles.primaryButton, (loading || code.length < 9) && styles.buttonDisabled]}
          onPress={() => resolveCode(code)}
          disabled={loading || code.length < 9}
        >
          {loading ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.primaryButtonText}>Continuar</Text>}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.linkButton} onPress={toggleScanner}>
        <Ionicons name={scanning ? "keypad-outline" : "qr-code-outline"} size={16} color={colors.primary} />
        <Text style={styles.linkButtonText}>{scanning ? "Escribir el código a mano" : "Escanear código QR"}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: "center" },
  backButton: { position: "absolute", top: 56, left: 20, padding: 6 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 6, marginBottom: 28 },
  codeInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 3,
    textAlign: "center",
    color: colors.text,
    marginBottom: 12,
  },
  cameraBox: {
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 12,
  },
  camera: { flex: 1 },
  error: { color: colors.danger, fontSize: 12.5, textAlign: "center", marginBottom: 10 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: colors.primaryText, fontSize: 15, fontWeight: "700" },
  linkButton: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", marginTop: 18 },
  linkButtonText: { color: colors.primary, fontSize: 13.5, fontWeight: "600" },
  confirmCard: { alignItems: "center", marginBottom: 28 },
  churchLogo: { width: 84, height: 84, borderRadius: 20, marginBottom: 16 },
  churchLogoPlaceholder: {
    width: 84, height: 84, borderRadius: 20, marginBottom: 16,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  confirmLabel: { fontSize: 13, color: colors.muted },
  churchName: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 4, textAlign: "center" },
  churchCity: { fontSize: 13, color: colors.muted, marginTop: 3 },
});
