import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { authService } from "../services/api";
import { authEvents } from "../services/authEvents";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Identidad "liviana" de un miembro sin cuenta: no hay token de sesión
  // real todavía (fase 1 del acceso de miembros, ver el código de
  // invitación en Configuración → Iglesia), solo la iglesia con la que este
  // dispositivo quedó asociado tras redimir un código.
  const [joinedChurch, setJoinedChurch] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
    setUser(null);
  }, []);

  const leaveChurch = useCallback(async () => {
    await SecureStore.deleteItemAsync("joinedChurch");
    setJoinedChurch(null);
  }, []);

  // Sesión guardada de una apertura anterior, y el token expirado a medio
  // uso (401 del backend) — mismo camino de salida para los dos.
  useEffect(() => {
    (async () => {
      const [storedToken, storedUser, storedChurch] = await Promise.all([
        SecureStore.getItemAsync("token"),
        SecureStore.getItemAsync("user"),
        SecureStore.getItemAsync("joinedChurch"),
      ]);
      if (storedToken && storedUser) setUser(JSON.parse(storedUser));
      if (storedChurch) setJoinedChurch(JSON.parse(storedChurch));
      setLoading(false);
    })();

    const sub = authEvents.addListener("unauthorized", logout);
    return () => sub.remove();
  }, [logout]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    await SecureStore.setItemAsync("token", data.token);
    await SecureStore.setItemAsync("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const joinChurch = async (church) => {
    await SecureStore.setItemAsync("joinedChurch", JSON.stringify(church));
    setJoinedChurch(church);
  };

  return (
    <AuthContext.Provider value={{ user, joinedChurch, loading, login, logout, joinChurch, leaveChurch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
