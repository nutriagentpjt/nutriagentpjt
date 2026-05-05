import { calculateBMR, calculateTDEE } from './tdeeCalculator';

describe('tdeeCalculator', () => {
  it('calculates male BMR with Mifflin-St Jeor formula', () => {
    expect(calculateBMR('MALE', 70, 175, 25)).toBe(1673.75);
  });

  it('calculates female BMR with Mifflin-St Jeor formula', () => {
    expect(calculateBMR('FEMALE', 60, 165, 30)).toBe(1320.25);
  });

  it('calculates TDEE from activity level multiplier', () => {
    expect(calculateTDEE(1600, 'MODERATELY_ACTIVE')).toBe(2480);
    expect(calculateTDEE(1600, 'VERY_ACTIVE')).toBe(2760);
  });
});
