import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { authEvents } from "./authEvents";

// Sin CORS que sortear aquí: eso es cosa del navegador, no de una app
// nativa — a diferencia de la web, esta URL puede apuntar directo a la IP
// de la red local del backend sin proxy ni configuración extra.
//
// EXPO_PUBLIC_API_URL viene de .env (producción, committeado) o de
// .env.local (gitignored, para pisar con la IP de LAN al desarrollar en
// el celular por WiFi — ver .env.example). El literal de acá abajo es
// solo el último respaldo si ninguno de los dos .env está presente.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.4.22:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authEvents.emit("unauthorized");
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
};

// Sin token: es la puerta de entrada para alguien que todavía no tiene
// cuenta — un miembro común, no del equipo. Mismo criterio que la pantalla
// del salón: responde solo lo que ya es público (nombre, logo), nada que
// identifique a una persona.
export const publicService = {
  resolveJoinCode: async (joinCode) => {
    const response = await api.get(`/public/church/${encodeURIComponent(joinCode)}`);
    return response.data;
  },
  getUpcomingEvents: async (churchId) => {
    const response = await api.get(`/public/church/${churchId}/events`);
    return response.data;
  },
  getPrayerDays: async (churchId) => {
    const response = await api.get(`/public/church/${churchId}/prayer-days`);
    return response.data;
  },
  getGroups: async (churchId) => {
    const response = await api.get(`/public/church/${churchId}/groups`);
    return response.data;
  },
  getAnnouncements: async (churchId) => {
    const response = await api.get(`/public/church/${churchId}/announcements`);
    return response.data;
  },
  getLiveStream: async (churchId) => {
    const response = await api.get(`/public/church/${churchId}/live-stream`);
    return response.data;
  },
  getPhotos: async (churchId, deviceId) => {
    const response = await api.get(`/public/church/${churchId}/photos`, {
      params: deviceId ? { deviceId } : {},
    });
    return response.data;
  },
  toggleLike: async (churchId, photoId, deviceId) => {
    const response = await api.post(`/public/church/${churchId}/photos/${photoId}/like`, { deviceId });
    return response.data;
  },
  getPhotoComments: async (churchId, photoId) => {
    const response = await api.get(`/public/church/${churchId}/photos/${photoId}/comments`);
    return response.data;
  },
  addPhotoComment: async (churchId, photoId, deviceId, authorName, body) => {
    const response = await api.post(`/public/church/${churchId}/photos/${photoId}/comments`, {
      deviceId, authorName, body,
    });
    return response.data;
  },
};

export const announcementsService = {
  getAll: async () => {
    const response = await api.get("/announcements");
    return response.data;
  },
  create: async (title, body) => {
    const response = await api.post("/announcements", { title, body });
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
};

export const conferenceService = {
  getAll: async () => {
    const response = await api.get("/conference");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/conference/${id}`);
    return response.data;
  },
  checkIn: async (checkInToken, sessionId) => {
    const response = await api.post("/conference/check-in", { checkInToken, sessionId });
    return response.data;
  },
  getSessionAttendance: async (sessionId) => {
    const response = await api.get(`/conference/sessions/${sessionId}/attendance`);
    return response.data;
  },
};

export const eventsService = {
  getAll: async (params) => {
    const response = await api.get("/events", { params });
    return response.data;
  },
  getById: async (eventId) => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },
  getAttendance: async (eventId) => {
    const response = await api.get(`/events/${eventId}/attendance`);
    return response.data;
  },
  recordBulkAttendance: async (eventId, memberIds) => {
    const response = await api.post(`/events/${eventId}/attendance/bulk`, { memberIds });
    return response.data;
  },
  deleteAttendance: async (eventId, attendanceId) => {
    const response = await api.delete(`/events/${eventId}/attendance/${attendanceId}`);
    return response.data;
  },
  updateGuestCount: async (eventId, guestCount) => {
    const response = await api.put(`/events/${eventId}/guest-count`, { guestCount });
    return response.data;
  },
};

export const groupsService = {
  getAll: async () => {
    const response = await api.get("/groups");
    return response.data;
  },
  getStats: async () => {
    const response = await api.get("/groups/stats");
    return response.data;
  },
};

export const membersService = {
  getAll: async (params) => {
    const response = await api.get("/members", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/members/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get("/members/stats");
    return response.data;
  },
  getBirthdays: async (params) => {
    const response = await api.get("/members/birthdays", { params });
    return response.data;
  },
};

export const visitorsService = {
  getAll: async (params) => {
    const response = await api.get("/visitors", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/visitors/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get("/visitors/stats");
    return response.data;
  },
};

export const baptismsService = {
  getAll: async (params) => {
    const response = await api.get("/baptisms", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/baptisms/${id}`);
    return response.data;
  },
  getStats: async (params) => {
    const response = await api.get("/baptisms/stats", { params });
    return response.data;
  },
};

// Montos — el backend exige ADMIN/PASTOR/TESORERO en estas dos rutas, así
// que solo se llaman cuando el rol en sesión califica (ver ResumenScreen).
export const financesService = {
  getSummary: async (params) => {
    const response = await api.get("/finances/summary", { params });
    return response.data;
  },
  getMonthly: async (params) => {
    const response = await api.get("/finances/monthly", { params });
    return response.data;
  },
};

export const leadersService = {
  getAll: async (params) => {
    const response = await api.get("/leaders", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/leaders/${id}`);
    return response.data;
  },
};

export const activitiesService = {
  getAll: async (params) => {
    const response = await api.get("/activities", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get("/activities/stats");
    return response.data;
  },
};

export const prayerService = {
  getAll: async (params) => {
    const response = await api.get("/prayer", { params });
    return response.data;
  },
};

export const settingsService = {
  getChurch: async () => {
    const response = await api.get("/settings/church");
    return response.data;
  },
  getChurchPhotos: async () => {
    const response = await api.get("/settings/church/photos");
    return response.data;
  },
};

export default api;
