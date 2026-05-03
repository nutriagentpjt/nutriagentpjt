import { Coffee, Moon, Sun, Utensils } from 'lucide-react';
import type { MealType } from '@/types';

interface MealTypeSelectorProps {
  value: MealType;
  onChange: (value: MealType) => void;
}

const mealTypeOptions: Array<{
  label: string;
  value: MealType;
  Icon: typeof Coffee;
}> = [
  { label: '아침', value: 'breakfast', Icon: Coffee },
  { label: '점심', value: 'lunch', Icon: Sun },
  { label: '저녁', value: 'dinner', Icon: Moon },
  { label: '간식', value: 'snack', Icon: Utensils },
];

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {mealTypeOptions.map(({ label, value: optionValue, Icon }) => (
        <button
          key={optionValue}
          type="button"
          onClick={() => onChange(optionValue)}
          className={`min-touch flex flex-col items-center justify-center gap-2 rounded-xl border-2 py-3 transition-all ${
            value === optionValue
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
          aria-label={`${label} 선택`}
          aria-pressed={value === optionValue}
        >
          <Icon className="h-5 w-5" />
          <span className="text-xs font-semibold">{label}</span>
        </button>
      ))}
    </div>
  );
}
