import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SettingsState {
  // 사용자 목표
  dailyCalorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  fiberGoal: number;
  
  // 설정 업데이트
  setDailyCalorieGoal: (goal: number) => void;
  setMacroGoals: (protein: number, carbs: number, fat: number, fiber: number) => void;
  
  // 테마 설정
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // 알림 설정
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        // 기본 목표값
        dailyCalorieGoal: 2000,
        proteinGoal: 150,
        carbsGoal: 250,
        fatGoal: 65,
        fiberGoal: 25,
        
        setDailyCalorieGoal: (goal) => set({ dailyCalorieGoal: goal }),
          setMacroGoals: (goals: {
              protein: number;
              carbs: number;
              fat: number;
              fiber: number;
          }) =>
              set({
                  proteinGoal: goals.protein,
                  carbsGoal: goals.carbs,
                  fatGoal: goals.fat,
                  fiberGoal: goals.fiber,
              }),
        
        theme: 'system',
        setTheme: (theme) => set({ theme }),
        
        notificationsEnabled: true,
        setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      }),
      {
        name: 'settings-storage',
      }
    ),
    {
      name: 'SettingsStore',
    }
  )
);
