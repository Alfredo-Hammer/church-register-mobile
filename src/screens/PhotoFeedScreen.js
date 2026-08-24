import { useState, useEffect, useRef } from "react";
import {
  View, Image, FlatList, TouchableOpacity, Text, TextInput, StyleSheet,
  useWindowDimensions, KeyboardAvoidingView, Platform, Modal, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { publicService } from "../services/api";
import { getDeviceId, getRememberedName, rememberName } from "../utils/deviceIdentity";
import { colors } from "../theme";

function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

// Doble-tap sobre la foto = like, mismo gesto que Instagram/TikTok. El
// corazón grande es puramente decorativo (pointerEvents="none"), el toque
// real lo maneja el TouchableOpacity de atrás.
function PhotoSlide({ photo, height, onLike, onOpenComments }) {
  const [heartPop, setHeartPop] = useState(false);
  const lastTap = useRef(0);

  const handlePhotoPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!photo.liked_by_me) onLike();
      setHeartPop(true);
      setTimeout(() => setHeartPop(false), 700);
    }
    lastTap.current = now;
  };

  return (
    <View style={{ height, width: "100%" }}>
      <TouchableOpacity activeOpacity={1} onPress={handlePhotoPress} style={StyleSheet.absoluteFill}>
        <Image source={{ uri: photo.photo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </TouchableOpacity>

      {heartPop && (
        <View style={styles.heartPopOverlay} pointerEvents="none">
          <Ionicons name="heart" size={110} color="#fff" />
        </View>
      )}

      <SafeAreaView style={styles.sideActions} edges={["bottom"]} pointerEvents="box-none">
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Ionicons name={photo.liked_by_me ? "heart" : "heart-outline"} size={32} color={photo.liked_by_me ? "#f43f5e" : "#fff"} />
          <Text style={styles.actionCount}>{photo.like_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onOpenComments}>
          <Ionicons name="chatbubble-outline" size={28} color="#fff" />
          <Text style={styles.actionCount}>{photo.comment_count}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function CommentSheet({ visible, photo, churchId, deviceId, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible || !photo) return;
    setLoading(true);
    setError("");
    publicService.getPhotoComments(churchId, photo.id)
      .then((data) => setComments(data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
    getRememberedName().then((n) => { setName(n); setNeedsName(!n); });
  }, [visible, photo?.id, churchId]);

  const submit = async () => {
    if (!text.trim() || (needsName && !name.trim())) return;
    setPosting(true);
    setError("");
    try {
      const res = await publicService.addPhotoComment(churchId, photo.id, deviceId, name.trim(), text.trim());
      const nextComments = [...comments, res.comment];
      setComments(nextComments);
      onCommentAdded(photo.id, nextComments.length);
      setText("");
      if (needsName) {
        await rememberName(name.trim());
        setNeedsName(false);
      }
    } catch (e) {
      setError(e?.response?.data?.error || "No se pudo publicar el comentario.");
    } finally {
      setPosting(false);
    }
  };

  if (!photo) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetWrap}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Comentarios</Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20, marginBottom: 20 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              style={{ maxHeight: 260 }}
              ListEmptyComponent={<Text style={styles.emptyComments}>Sé el primero en comentar.</Text>}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Text style={styles.commentAuthor}>{item.author_name}</Text>
                  <Text style={styles.commentBody}>{item.body}</Text>
                  <Text style={styles.commentTime}>{formatRelativeTime(item.created_at)}</Text>
                </View>
              )}
            />
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {needsName && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor={colors.muted}
              style={styles.nameInput}
              maxLength={100}
            />
          )}
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Escribe un comentario…"
              placeholderTextColor={colors.muted}
              style={styles.commentInput}
              maxLength={500}
              multiline
            />
            <TouchableOpacity
              onPress={submit}
              disabled={posting || !text.trim() || (needsName && !name.trim())}
              style={styles.sendButton}
            >
              <Ionicons
                name="send"
                size={18}
                color={posting || !text.trim() || (needsName && !name.trim()) ? colors.muted : colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Feed vertical tipo Reels: una foto por pantalla, deslizás hacia
// arriba/abajo para la siguiente. Se abre al tocar una foto en el
// PhotoCarousel del Inicio (staff o miembro) — vuelve a pedir la galería
// completa acá (con deviceId) en vez de reusar lo que ya tenía el
// carrusel, para traer like_count/comment_count/liked_by_me al día.
export default function PhotoFeedScreen({ route, navigation }) {
  const { churchId, initialIndex = 0 } = route.params;
  const { height: windowHeight } = useWindowDimensions();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState(null);
  const [commentsFor, setCommentsFor] = useState(null);

  useEffect(() => {
    (async () => {
      const id = await getDeviceId();
      setDeviceId(id);
      try {
        const data = await publicService.getPhotos(churchId, id);
        setPhotos(data.photos || []);
      } catch { /* silencioso */ }
      setLoading(false);
    })();
  }, [churchId]);

  const updatePhoto = (photoId, patch) => {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, ...patch } : p)));
  };

  const handleLike = async (photo) => {
    if (!deviceId) return;
    const nextLiked = !photo.liked_by_me;
    updatePhoto(photo.id, { liked_by_me: nextLiked, like_count: photo.like_count + (nextLiked ? 1 : -1) });
    try {
      const res = await publicService.toggleLike(churchId, photo.id, deviceId);
      updatePhoto(photo.id, { liked_by_me: res.liked, like_count: res.likeCount });
    } catch {
      updatePhoto(photo.id, { liked_by_me: photo.liked_by_me, like_count: photo.like_count });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PhotoSlide
            photo={item}
            height={windowHeight}
            onLike={() => handleLike(item)}
            onOpenComments={() => setCommentsFor(item)}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({ length: windowHeight, offset: windowHeight * i, index: i })}
      />

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="close" size={26} color="#fff" />
      </TouchableOpacity>

      <CommentSheet
        visible={!!commentsFor}
        photo={commentsFor}
        churchId={churchId}
        deviceId={deviceId}
        onClose={() => setCommentsFor(null)}
        onCommentAdded={(photoId, newCount) => updatePhoto(photoId, { comment_count: newCount })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  closeButton: {
    position: "absolute", top: 54, right: 20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center",
  },
  heartPopOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  sideActions: {
    position: "absolute", right: 12, bottom: 40, alignItems: "center", gap: 22,
  },
  actionButton: { alignItems: "center", gap: 3 },
  actionCount: { color: "#fff", fontSize: 12, fontWeight: "700" },

  sheetWrap: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 12 },
  sheetTitle: { color: colors.text, fontSize: 15, fontWeight: "800", marginBottom: 10 },
  emptyComments: { color: colors.muted, fontSize: 13, paddingVertical: 20, textAlign: "center" },
  commentRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  commentAuthor: { color: colors.text, fontSize: 12.5, fontWeight: "700" },
  commentBody: { color: colors.text, fontSize: 13.5, marginTop: 2, lineHeight: 18 },
  commentTime: { color: colors.muted, fontSize: 10.5, marginTop: 3 },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 8 },
  nameInput: {
    marginTop: 10, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: colors.text, fontSize: 13.5,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 10 },
  commentInput: {
    flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, color: colors.text, fontSize: 13.5, maxHeight: 90,
  },
  sendButton: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
});
