import { create } from 'zustand';

interface StoreState {
  currentDate: string;
  setCurrentDate: (date: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  settings: Record<string, string>;
  setSettings: (s: Record<string, string>) => void;
}

export const useStore = create<StoreState>((set) => ({
  currentDate: new Date().toISOString().split('T')[0],
  setCurrentDate: (date) => set({ currentDate: date }),
  refreshKey: 0,
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
  settings: {},
  setSettings: (settings) => set({ settings }),
}));
