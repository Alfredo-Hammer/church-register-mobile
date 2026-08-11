import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { authEvents } from "./authEvents";

// Sin CORS que sortear aquí: eso es cosa del navegador, no de una app
// nativa — a diferencia de la web, esta URL puede apuntar directo a la IP
// de la red local del backend sin proxy ni configuración extra.
//
// Cambiar aquí cuando el backend viva en otro lugar (producción, otra red).
export const API_URL = "http://192.168.4.22:3000/api";

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
};

export const membersService = {
  getAll: async (params) => {
    const response = await api.get("/members", { params });
    return response.data;
  },
};

export default api;
