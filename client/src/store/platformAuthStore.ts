import { create } from "zustand";

interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PlatformAuthState {
  admin: PlatformAdmin | null;
  token: string | null;
  login: (admin: PlatformAdmin, token: string) => void;
  logout: () => void;
}

export const usePlatformAuthStore = create<PlatformAuthState>((set) => ({
  admin: JSON.parse(localStorage.getItem("platform_admin") || "null"),
  token: localStorage.getItem("platform_token"),
  login: (admin, token) => {
    localStorage.setItem("platform_admin", JSON.stringify(admin));
    localStorage.setItem("platform_token", token);
    set({ admin, token });
  },
  logout: () => {
    localStorage.removeItem("platform_admin");
    localStorage.removeItem("platform_token");
    set({ admin: null, token: null });
  },
}));
