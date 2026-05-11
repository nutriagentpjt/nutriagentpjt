import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';
export type Language = 'ko' | 'en';
export type TimeString = string;
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
    breakfastTime: TimeString;
    lunchTime: TimeString;
    dinnerTime: TimeString;
  };
  waterReminder: {
    enabled: boolean;
    startTime: TimeString;
    endTime: TimeString;
    intervalHours: 1 | 2 | 3 | 4;
  };
  weightReminder: {
    enabled: boolean;
    day: WeeklyReminderDay;
    time: TimeString;
  };
  aiCoachingReminder: {
    enabled: boolean;
    time: TimeString;
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

function isValidTimeString(value: string): value is TimeString {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function sanitizeWaterIntervalHours(value: number): 1 | 2 | 3 | 4 {
  if (value <= 1) return 1;
  if (value >= 4) return 4;
  return Math.round(value) as 1 | 2 | 3 | 4;
}

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
                ...(updates.breakfastTime && isValidTimeString(updates.breakfastTime)
                  ? { breakfastTime: updates.breakfastTime }
                  : {}),
                ...(updates.lunchTime && isValidTimeString(updates.lunchTime)
                  ? { lunchTime: updates.lunchTime }
                  : {}),
                ...(updates.dinnerTime && isValidTimeString(updates.dinnerTime)
                  ? { dinnerTime: updates.dinnerTime }
                  : {}),
                ...(typeof updates.enabled === 'boolean' ? { enabled: updates.enabled } : {}),
              },
            },
          })),
        updateWaterReminder: (updates) =>
          set((state) => {
            const current = state.notifications.waterReminder;
            const nextStartTime =
              updates.startTime && isValidTimeString(updates.startTime) ? updates.startTime : current.startTime;
            const nextEndTime =
              updates.endTime && isValidTimeString(updates.endTime) ? updates.endTime : current.endTime;

            if (nextStartTime >= nextEndTime) {
              return state;
            }

            return {
              notifications: {
                ...state.notifications,
                waterReminder: {
                  ...current,
                  ...(updates.startTime && isValidTimeString(updates.startTime)
                    ? { startTime: updates.startTime }
                    : {}),
                  ...(updates.endTime && isValidTimeString(updates.endTime)
                    ? { endTime: updates.endTime }
                    : {}),
                  ...(typeof updates.intervalHours === 'number'
                    ? { intervalHours: sanitizeWaterIntervalHours(updates.intervalHours) }
                    : {}),
                  ...(typeof updates.enabled === 'boolean' ? { enabled: updates.enabled } : {}),
                },
              },
            };
          }),
        updateWeightReminder: (updates) =>
          set((state) => ({
            notifications: {
              ...state.notifications,
              weightReminder: {
                ...state.notifications.weightReminder,
                ...(updates.time && isValidTimeString(updates.time) ? { time: updates.time } : {}),
                ...(updates.day ? { day: updates.day } : {}),
                ...(typeof updates.enabled === 'boolean' ? { enabled: updates.enabled } : {}),
              },
            },
          })),
        updateAiCoachingReminder: (updates) =>
          set((state) => ({
            notifications: {
              ...state.notifications,
              aiCoachingReminder: {
                ...state.notifications.aiCoachingReminder,
                ...(updates.time && isValidTimeString(updates.time) ? { time: updates.time } : {}),
                ...(typeof updates.enabled === 'boolean' ? { enabled: updates.enabled } : {}),
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
