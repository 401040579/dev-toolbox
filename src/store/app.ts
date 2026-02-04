import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface AppState {
  theme: Theme;
  sidebarCollapsed: boolean;
  recentTools: string[];
  favorites: string[];
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  addRecentTool: (toolId: string) => void;
  toggleFavorite: (toolId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      recentTools: [],
      favorites: [],

      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        set({ theme: next });
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      addRecentTool: (toolId) =>
        set((s) => ({
          recentTools: [toolId, ...s.recentTools.filter((id) => id !== toolId)].slice(0, 10),
        })),

      toggleFavorite: (toolId) =>
        set((s) => ({
          favorites: s.favorites.includes(toolId)
            ? s.favorites.filter((id) => id !== toolId)
            : [...s.favorites, toolId],
        })),
    }),
    {
      name: 'dev-toolbox-app',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        recentTools: state.recentTools,
        favorites: state.favorites,
      }),
    },
  ),
);
