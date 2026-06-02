import type { MealType } from '@/types';

const BREAKFAST_START = 7 * 60;
const BREAKFAST_END = 10 * 60 + 29;
const LUNCH_START = 10 * 60 + 30;
const LUNCH_END = 14 * 60;
const DINNER_START = 17 * 60;
const DINNER_END = 20 * 60 + 30;

export function getMealTypeFromHourMinute(hour: number, minute = 0): MealType {
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes >= BREAKFAST_START && totalMinutes <= BREAKFAST_END) {
    return 'breakfast';
  }

  if (totalMinutes >= LUNCH_START && totalMinutes <= LUNCH_END) {
    return 'lunch';
  }

  if (totalMinutes >= DINNER_START && totalMinutes <= DINNER_END) {
    return 'dinner';
  }

  return 'snack';
}

export function getMealTypeFromDate(date: Date): MealType {
  return getMealTypeFromHourMinute(date.getHours(), date.getMinutes());
}

export function getMealTypeFromTimeString(time: string): MealType {
  const [hourText = '0', minuteText = '0'] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  return getMealTypeFromHourMinute(
    Number.isFinite(hour) ? hour : 0,
    Number.isFinite(minute) ? minute : 0,
  );
}

export const mealTypeDisplayRanges: Record<Exclude<MealType, 'snack'>, string> = {
  breakfast: '07:00-10:29',
  lunch: '10:30-14:00',
  dinner: '17:00-20:30',
};
