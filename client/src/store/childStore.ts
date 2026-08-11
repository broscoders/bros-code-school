import { create } from "zustand";

interface ChildState {
  selectedChildId: string | null;
  setSelectedChild: (id: string) => void;
}

export const useChildStore = create<ChildState>((set) => ({
  selectedChildId: null,
  setSelectedChild: (id) => set({ selectedChildId: id }),
}));
