import { create } from "zustand";
import api from "../services/api";
import { shade } from "../utils/color";

interface SchoolBranding {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
}

interface SchoolState {
  school: SchoolBranding | null;
  loading: boolean;
  fetchSchool: (schoolId: string) => Promise<void>;
  applyTheme: (primaryColor: string, secondaryColor: string) => void;
  clear: () => void;
}

// Fallback logo shown whenever a school hasn't set its own — drop a file at
// public/school-logo.png in this project (the frontend's public/ folder,
// not the backend) and it will be picked up automatically.
export const DEFAULT_LOGO_URL = "/school-logo.png";

export const useSchoolStore = create<SchoolState>((set) => ({
  school: null,
  loading: false,

  applyTheme: (primaryColor, secondaryColor) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", primaryColor);
    root.style.setProperty("--color-primary-dark", shade(primaryColor, -0.35));
    root.style.setProperty("--color-primary-light", shade(primaryColor, 0.2));
    root.style.setProperty("--color-accent", secondaryColor);
    root.style.setProperty("--color-accent-soft", shade(secondaryColor, 0.75));
  },

  fetchSchool: async (schoolId: string) => {
    set({ loading: true });
    try {
      const res = await api.get(`/schools/${schoolId}`);
      const school: SchoolBranding = {
        id: res.data._id,
        name: res.data.name,
        logoUrl: res.data.logoUrl,
        primaryColor: res.data.primaryColor || "#1d3557",
        secondaryColor: res.data.secondaryColor || "#c9a227",
      };
      set({ school, loading: false });
      const root = document.documentElement;
      root.style.setProperty("--color-primary", school.primaryColor);
      root.style.setProperty("--color-primary-dark", shade(school.primaryColor, -0.35));
      root.style.setProperty("--color-primary-light", shade(school.primaryColor, 0.2));
      root.style.setProperty("--color-accent", school.secondaryColor);
      root.style.setProperty("--color-accent-soft", shade(school.secondaryColor, 0.75));
    } catch {
      set({ loading: false });
    }
  },

  clear: () => set({ school: null }),
}));
