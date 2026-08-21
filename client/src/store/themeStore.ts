import { create } from "zustand";

type Theme = "dark" | "light";

const applyThemeClass = (theme: Theme) => {
  document.documentElement.classList.toggle("light", theme === "light");
};

const initialTheme = (localStorage.getItem("theme") as Theme) || "dark";
applyThemeClass(initialTheme);

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyThemeClass(next);
    set({ theme: next });
  },
}));