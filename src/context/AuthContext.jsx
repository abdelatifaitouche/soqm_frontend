import { createContext, useState, useEffect, useCallback } from "react";
import axiosClient, { setAuthInterceptors } from "@/api/axiosClient";
import { getToken, saveToken, removeToken, decodeToken } from "@/utils/tokenUtils";
import { toast } from "sonner";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authReady, setAuthReady] = useState(false);
  // =====================
  // INITIAL USER STATE
  // =====================
  const [user, setUser] = useState(() => {
    const token = getToken();
    return token ? decodeToken(token) : null;
  });

  // =====================
  // LOGOUT
  // =====================
  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    toast.error("Logged out");
  }, []);

  // =====================
  // REFRESH TOKEN
  // =====================
  const refreshToken = useCallback(async () => {
    try {
      const { data } = await axiosClient.post("/auth/refresh/");

      const { access_token } = data;

      saveToken(access_token);
      setUser(decodeToken(access_token));

      return access_token;
    } catch (err) {
      removeToken();
      setUser(null);

      toast.error("Session expired. Please login again.");

      throw err;
    }
  }, []);

  // =====================
  // LOGIN
  // =====================
  const login = async (email, password) => {
    try {
      const { data } = await axiosClient.post("/auth/login/", {
        email,
        password,
      });

      const { access_token } = data;

      saveToken(access_token);
      setUser(decodeToken(access_token));

      toast.success("Welcome back");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Login failed";

      toast.error(message);
      throw err;
    }
  };

  // =====================
  // ATTACH INTERCEPTORS ONCE
  // =====================
  useEffect(() => {
    setAuthInterceptors(refreshToken, logout);
    setAuthReady(true);

  }, []); // IMPORTANT: keep stable

  // =====================
  // CONTEXT VALUE
  // =====================
  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    authReady
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}