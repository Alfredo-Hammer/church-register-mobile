import { useState, useEffect } from "react";
import { View, TouchableOpacity, ActivityIndicator, StyleSheet, useWindowDimensions } from "react-native";
import { WebView } from "react-native-webview";
import * as ScreenOrientation from "expo-screen-orientation";
import { Ionicons } from "@expo/vector-icons";
import { buildFacebookEmbedUrl } from "../utils/facebookEmbed";

// Facebook no respeta el parámetro `height` que le pedimos en la URL del
// plugin — reescala el video a su proporción real, que varía según cómo
// grabó cada iglesia (probado con un video real: salió ~1.54:1, no 16:9).
// Se usa 4:3 a propósito, más "cuadrado" que 16:9, porque una caja un
// poco más alta de lo necesario en un video panorámico deja franjas
// vacías (aceptable), mientras que una caja demasiado baja recorta parte
// del video real (mucho peor) — WebView no crece para ajustarse al
// contenido, solo muestra lo que entra en el tamaño que se le da.
const ASPECT_RATIO = 4 / 3;

// Pantalla completa con la transmisión/video de Facebook embebido. Dos
// cosas que la página del plugin de Facebook no resuelve sola (verificado
// navegando directo a video.php): el video no se centra ni ocupa el
// contenedor — hay que calcular nosotros un recuadro que entre en la
// pantalla (en cualquier orientación) y centrarlo a mano.
export default function LiveStreamScreen({ route, navigation }) {
  const { streamUrl } = route.params;
  const [loading, setLoading] = useState(true);
  const { width: winW, height: winH } = useWindowDimensions();

  // Girar el teléfono agranda el video como cualquier reproductor — el
  // resto de la app se mantiene en portrait (ver app.json), así que acá
  // se desbloquea la orientación al entrar y se vuelve a portrait al salir.
  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  let videoWidth = winW;
  let videoHeight = videoWidth / ASPECT_RATIO;
  if (videoHeight > winH) {
    videoHeight = winH;
    videoWidth = videoHeight * ASPECT_RATIO;
  }

  // La URL que carga el WebView se calcula UNA sola vez, con el tamaño de
  // la orientación inicial — nunca cambia después. Antes se recalculaba
  // (con una `key` distinta) en cada cambio de tamaño, así que rotar la
  // pantalla forzaba al WebView a recargar la página entera: video
  // reiniciado, mute y volumen perdidos. La caja de afuera sí se sigue
  // recalculando en cada render para centrar/letterbox correctamente —
  // el WebView, al ser una página con su propio layout, se reacomoda
  // solo al tamaño nuevo sin necesidad de recargar nada.
  const [embedUrl] = useState(() => buildFacebookEmbedUrl(streamUrl, videoWidth, videoHeight));

  return (
    <View style={styles.container}>
      <View style={[styles.videoBox, { width: videoWidth, height: videoHeight }]}>
        <WebView
          source={{ uri: embedUrl }}
          style={styles.webview}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          onLoadEnd={() => setLoading(false)}
        />
      </View>

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
  container: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  videoBox: { overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "#000" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  closeButton: {
    position: "absolute", top: 54, right: 20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center",
  },
});
