import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';
export type Language = 'ko' | 'en';
export type WeeklyReminderDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface NotificationSettings {
  enabled: boolean;
  mealReminders: {
    enabled: boolean;
    breakfastTime: string;
    lunchTime: string;
    dinnerTime: string;
  };
  waterReminder: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    intervalHours: number;
  };
  weightReminder: {
    enabled: boolean;
    day: WeeklyReminderDay;
    time: string;
  };
  aiCoachingReminder: {
    enabled: boolean;
    time: string;
  };
}

interface SettingsState {
  theme: ThemeMode;
  language: Language;
  notifications: NotificationSettings;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  updateMealReminders: (updates: Partial<NotificationSettings['mealReminders']>) => void;
  updateWaterReminder: (updates: Partial<NotificationSettings['waterReminder']>) => void;
  updateWeightReminder: (updates: Partial<NotificationSettings['weightReminder']>) => void;
  updateAiCoachingReminder: (updates: Partial<NotificationSettings['aiCoachingReminder']>) => void;
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  mealReminders: {
    enabled: true,
    breakfastTime: '08:00',
    lunchTime: '13:00',
    dinnerTime: '19:00',
  },
  waterReminder: {
    enabled: true,
    startTime: '09:00',
    endTime: '21:00',
    intervalHours: 2,
  },
  weightReminder: {
    enabled: true,
    day: 'MONDAY',
    time: '08:00',
  },
  aiCoachingReminder: {
    enabled: true,
    time: '20:00',
  },
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        language: 'ko',
        notifications: defaultNotificationSettings,
        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
        setNotificationsEnabled: (enabled) =>
          set((state) => ({
            notifications: {
              ...state.notifications,
              enabled,
            },
          })),
        updateMealReminders: (updates) =>
          set((state) => ({
            notifications: {
              ...state.notifications,
              mealReminders: {
                ...state.notifications.mealReminders,
                ...updates,
              },
            },
          })),
        updateWaterReminder: (updates) =>
          set((state) => ({
            notifications: {
              ...state.notifications,
              waterReminder: {
                ...state.notifications.waterReminder,
                ...updates,
              },
            },
          })),
        updateWeightReminder: (updates) =>
          set((state) => ({
            notifications: {
              ...state.notifications,
              weightReminder: {
                ...state.notifications.weightReminder,
                ...updates,
              },
            },
          })),
        updateAiCoachingReminder: (updates) =>
          set((state) => ({
            notifications: {
              ...state.notifications,
              aiCoachingReminder: {
                ...state.notifications.aiCoachingReminder,
                ...updates,
              },
            },
          })),
      }),
      {
        name: 'settings-storage',
      },
    ),
    { name: 'SettingsStore' },
  ),
);
