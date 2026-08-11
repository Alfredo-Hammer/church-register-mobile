// Paleta mínima — misma familia de azul que usa el panel web, sin intentar
// traer Tailwind a React Native.
export const colors = {
  background: "#0b1120",
  card: "#131b2e",
  cardAlt: "#1a2338",
  border: "#1f2a44",
  text: "#f1f5f9",
  muted: "#94a3b8",
  primary: "#2563eb",
  primaryText: "#ffffff",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
};

// Header de la pantalla de inicio — mismo azul que el resto de la app, solo
// que en degradado para darle algo de profundidad sin meter una imagen.
export const gradient = ["#1e3a8a", "#2563eb"];

// Un color por rol, para el chip debajo del nombre — mismos 4 roles que
// maneja el backend (ADMIN/PASTOR/TESORERO/LIDER).
export const ROLE_META = {
  ADMIN:     { label: "Administrador", color: "#a78bfa" },
  PASTOR:    { label: "Pastor",        color: "#60a5fa" },
  TESORERO:  { label: "Tesorero",      color: "#34d399" },
  LIDER:     { label: "Líder",         color: "#fbbf24" },
};

export function greetingForTime(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}
