import { useState, useEffect, useRef } from "react";
import { Modal, View, Image, ScrollView, TouchableOpacity, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Vista de pantalla completa al tocar una foto del carrusel — desliza entre
// todas las fotos de la galería, no solo la que se tocó. `initialIndex`
// posiciona el scroll de entrada sin animación (se hace en el próximo
// frame, después de que el Modal ya midió su tamaño).
export default function PhotoLightbox({ visible, photos, initialIndex = 0, onClose }) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: initialIndex * width, animated: false });
      });
    }
  }, [visible, initialIndex, width]);

  if (!photos || photos.length === 0) return null;

  const onScroll = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
        >
          {photos.map((p) => (
            <View key={p.id} style={{ width, height, alignItems: "center", justifyContent: "center" }}>
              <Image source={{ uri: p.photo_url }} style={{ width, height: height * 0.75 }} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>

        {photos.length > 1 && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{index + 1} / {photos.length}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  closeButton: {
    position: "absolute", top: 54, right: 20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center",
  },
  counter: {
    position: "absolute", top: 60, alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
  },
  counterText: { color: "#fff", fontSize: 12.5, fontWeight: "700" },
});
