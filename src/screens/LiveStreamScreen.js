import { useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { buildFacebookEmbedUrl } from "../utils/facebookEmbed";

// Pantalla completa con la transmisión de Facebook embebida — el WebView
// carga la página oficial de embed de Facebook (plugins/video.php), el
// mismo mecanismo que usaría un <iframe> en la web. Sin controles propios:
// los controles de play/pause/volumen son los que ya trae el player de
// Facebook dentro de esa página.
export default function LiveStreamScreen({ route, navigation }) {
  const { streamUrl } = route.params;
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: buildFacebookEmbedUrl(streamUrl) }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={() => setLoading(false)}
      />

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="close" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1, backgroundColor: "#000" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  closeButton: {
    position: "absolute", top: 54, right: 20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center",
  },
});
