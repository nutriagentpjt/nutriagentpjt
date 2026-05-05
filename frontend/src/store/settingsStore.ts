import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';
export type Language = 'ko' | 'en';

interface SettingsState {
  theme: ThemeMode;
  language: Language;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        language: 'ko',
        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
      }),
      {
        name: 'settings-storage',
      },
    ),
    { name: 'SettingsStore' },
  ),
);
