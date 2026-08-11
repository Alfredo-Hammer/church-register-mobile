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

export default api;
