import { useEffect, useState } from "react";
import type { User } from "../types/Auth";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const AUTH_EVENT = "auth-updated";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sync = () => {
      const t = localStorage.getItem(TOKEN_KEY);
      const u = localStorage.getItem(USER_KEY);
      setToken(t);
      setUser(u ? JSON.parse(u) : null);
    };
    // Initial load
    sync();
    // Listen for same-tab custom event updates
    const handler = () => sync();
    window.addEventListener(AUTH_EVENT, handler as EventListener);
    // Also listen to cross-tab storage events
    const storageHandler = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY || e.key === null) sync();
    };
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener(AUTH_EVENT, handler as EventListener);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const login = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    // Notify other hook instances in this tab
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Notify other hook instances in this tab
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  };

  return { token, user, login, logout };
}
