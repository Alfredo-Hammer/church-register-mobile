import { useState } from "react";
import { View, Image, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { colors } from "../theme";
import PhotoLightbox from "./PhotoLightbox";

// Carrusel horizontal con paginado (una foto ocupa el ancho completo, se
// desliza a la siguiente) + puntos indicadores debajo. Usado en el home de
// miembro (la "presentación de la iglesia") y el de staff, ambos con el
// mismo ancho de contenido (padding horizontal 20 en los dos).
const CONTENT_PADDING = 20;

export default function PhotoCarousel({ photos }) {
  const { width: windowWidth } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  if (!photos || photos.length === 0) return null;

  const slideWidth = windowWidth - CONTENT_PADDING * 2;

  const onScroll = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    if (newIndex !== index) setIndex(newIndex);
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={{ borderRadius: 16 }}
      >
        {photos.map((p, i) => (
          <TouchableOpacity key={p.id} activeOpacity={0.9} onPress={() => { setIndex(i); setLightboxOpen(true); }}>
            <Image
              source={{ uri: p.photo_url }}
              style={{ width: slideWidth, height: slideWidth * 0.62, borderRadius: 16 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((p, i) => (
            <View key={p.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
      <PhotoLightbox
        visible={lightboxOpen}
        photos={photos}
        initialIndex={index}
        onClose={() => setLightboxOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 16 },
});
