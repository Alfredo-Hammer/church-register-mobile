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

// Mismos 4 tipos que valida el CHECK de la tabla events en Postgres.
export const EVENT_TYPE_META = {
  CULTO:       { label: "Culto",           color: "#60a5fa" },
  REUNION:     { label: "Reunión",         color: "#a78bfa" },
  ESPECIAL:    { label: "Evento Especial", color: "#fbbf24" },
  CONFERENCIA: { label: "Conferencia",     color: "#f472b6" },
};

// Mismo índice que day_of_week en prayer_days (0=Domingo … 6=Sábado).
export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Mismo criterio de color que la web (CLAUDE.md): verde=ACTIVO, rojo=INACTIVO,
// amarillo=VISITANTE.
export const MEMBER_STATUS_META = {
  ACTIVO:    { label: "Activo",    color: "#34d399" },
  INACTIVO:  { label: "Inactivo",  color: "#f87171" },
  VISITANTE: { label: "Visitante", color: "#fbbf24" },
};

// Etapas del seguimiento de visitantes (visitors.stage).
export const VISITOR_STAGE_META = {
  PRIMERA_VISITA:  { label: "Primera visita",  color: "#60a5fa" },
  EN_SEGUIMIENTO:  { label: "En seguimiento",  color: "#fbbf24" },
  INTEGRADO:       { label: "Integrado",       color: "#34d399" },
  INACTIVO:        { label: "Inactivo",        color: "#94a3b8" },
};

export const HOW_THEY_CAME_META = {
  INVITADO:        "Invitado por alguien",
  REDES_SOCIALES:  "Redes sociales",
  PASO_POR_AQUI:   "Pasó por aquí",
  BUSQUEDA_WEB:    "Búsqueda web",
  OTRO:            "Otro",
};

// Mismas 6 categorías que valida el CHECK de la tabla activities.
export const ACTIVITY_CATEGORY_META = {
  RECOLECCION_FONDOS:  { label: "Recolección de fondos", color: "#34d399" },
  SERVICIO_COMUNITARIO: { label: "Servicio comunitario",  color: "#60a5fa" },
  CAPACITACION:         { label: "Capacitación",          color: "#a78bfa" },
  EVANGELISMO:          { label: "Evangelismo",           color: "#f472b6" },
  SOCIAL:               { label: "Social",                color: "#fbbf24" },
  OTRO:                 { label: "Otro",                  color: "#94a3b8" },
};

// Mismos 4 estados que valida el CHECK de la tabla activities.
export const ACTIVITY_STATUS_META = {
  PLANIFICADA: { label: "Planificada",  color: "#60a5fa" },
  EN_PROGRESO: { label: "En progreso",  color: "#fbbf24" },
  COMPLETADA:  { label: "Completada",   color: "#34d399" },
  CANCELADA:   { label: "Cancelada",    color: "#f87171" },
};

export function greetingForTime(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}
