import { useEffect, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

const PANEL_WIDTH = Math.min(300, Dimensions.get("window").width * 0.8);

// Drawer casero con Modal + Animated (ambos de React Native core) en vez de
// @react-navigation/drawer — ese arrastra react-native-gesture-handler y
// reanimated, dos dependencias nativas pesadas para algo que solo necesita
// deslizar un panel con seis links. Mismo criterio que SimpleBarChart: no
// sumar una librería cuando Views + Animated alcanzan.
export default function SideMenu({ visible, onClose, items, onNavigate }) {
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -PANEL_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
          <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Más módulos</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <View style={styles.list}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.item}
                  onPress={() => { onClose(); onNavigate(item.screen); }}
                >
                  <View style={[styles.itemIcon, { backgroundColor: `${item.iconColor}22` }]}>
                    <Ionicons name={item.icon} size={17} color={item.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", flexDirection: "row" },
  panel: {
    position: "absolute", left: 0, top: 0, bottom: 0, width: PANEL_WIDTH,
    backgroundColor: colors.card, borderRightWidth: 1, borderRightColor: colors.border,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  closeButton: { padding: 4 },
  list: { padding: 12, gap: 4 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12 },
  itemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  itemSubtitle: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
});
