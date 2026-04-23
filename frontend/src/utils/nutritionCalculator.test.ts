import { calculateNutrients, calculatePercentage, formatNutrition } from './nutritionCalculator';

describe('nutritionCalculator', () => {
  it('scales nutrients by serving ratio', () => {
    expect(
      calculateNutrients(
        { calories: 200, carbs: 20, protein: 10, fat: 5 },
        150,
        100,
      ),
    ).toEqual({
      calories: 300,
      carbs: 30,
      protein: 15,
      fat: 7.5,
    });
  });

  it('returns zeros for invalid serving size or amount', () => {
    expect(
      calculateNutrients(
        { calories: 200, carbs: 20, protein: 10, fat: 5 },
        0,
        100,
      ),
    ).toEqual({
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
    });
  });

  it('calculates percentage safely and formats nutrition labels', () => {
    expect(calculatePercentage(50, 200)).toBe(25);
    expect(calculatePercentage(10, 0)).toBe(0);
    expect(formatNutrition(12.6, 'g')).toBe('13g');
  });
});
