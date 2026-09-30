import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, logout as apiLogout, getToken, validateToken } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        const valid = await validateToken();
        setIsAuthenticated(valid);
      }
      setChecking(false);
    })();
  }, []);

  async function login(username, password) {
    await apiLogin(username, password);
    setIsAuthenticated(true);
  }

  function logout() {
    apiLogout();
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
