import { create } from "zustand";
import api from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
  login: (user, token) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    set({ user, token });
  },
  logout: () => {
    // Best-effort: revoke the session server-side (see Session model) so
    // the token can't keep being used by anyone who'd copied it, instead
    // of just forgetting it locally and letting it work until it expires
    // on its own in up to 7 days. Local state is cleared either way.
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));
