import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { authService } from "../services/api";
import { authEvents } from "../services/authEvents";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
    setUser(null);
  }, []);

  // Sesión guardada de una apertura anterior, y el token expirado a medio
  // uso (401 del backend) — mismo camino de salida para los dos.
  useEffect(() => {
    (async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      const storedUser = await SecureStore.getItemAsync("user");
      if (storedToken && storedUser) setUser(JSON.parse(storedUser));
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
