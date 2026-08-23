import { Component } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";

// Sin esto, un error de JS al arrancar (antes de que React llegue a
// montar nada) deja la pantalla completamente en blanco en un build
// standalone — Metro ya no está ahí para mostrar el overlay rojo de
// desarrollo. Este boundary es la única red que queda en ese caso.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary capturó un error:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Algo salió mal</Text>
            <Text style={styles.message}>{String(this.state.error?.message || this.state.error)}</Text>
            {this.state.error?.stack ? <Text style={styles.stack}>{this.state.error.stack}</Text> : null}
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={() => this.setState({ error: null })}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 20 },
  scroll: { paddingBottom: 24 },
  title: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 12 },
  message: { color: colors.danger, fontSize: 15, marginBottom: 16 },
  stack: { color: colors.muted, fontSize: 11, fontFamily: "monospace" },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 30,
  },
  buttonText: { color: colors.primaryText, fontWeight: "600", fontSize: 15 },
});
