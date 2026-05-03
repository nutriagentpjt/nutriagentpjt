export interface Food {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  servingUnit: string;
}

export interface Meal {
  id: string;
  foodId: string;
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  timestamp: Date;
}

export const foodDatabase: Food[] = [
  {
    id: "1",
    name: "Chicken Breast",
    brand: "Generic",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    servingSize: "100",
    servingUnit: "g",
  },
  {
    id: "2",
    name: "Brown Rice",
    brand: "Generic",
    calories: 112,
    protein: 2.6,
    carbs: 24,
    fat: 0.9,
    fiber: 1.8,
    servingSize: "100",
    servingUnit: "g",
  },
  {
    id: "3",
    name: "Avocado",
    calories: 160,
    protein: 2,
    carbs: 8.5,
    fat: 14.7,
    fiber: 6.7,
    servingSize: "100",
    servingUnit: "g",
  },
  {
    id: "4",
    name: "Greek Yogurt",
    brand: "Plain, Non-Fat",
    calories: 59,
    protein: 10,
    carbs: 3.6,
    fat: 0.4,
    fiber: 0,
    servingSize: "100",
    servingUnit: "g",
  },
  {
    id: "5",
    name: "Banana",
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    fiber: 2.6,
    servingSize: "1",
    servingUnit: "medium",
  },
  {
    id: "6",
    name: "Almonds",
    calories: 579,
    protein: 21,
    carbs: 22,
    fat: 49,
    fiber: 12,
    servingSize: "100",
    servingUnit: "g",
  },
  {
    id: "7",
    name: "Salmon",
    brand: "Atlantic, Wild",
    calories: 142,
    protein: 20,
    carbs: 0,
    fat: 6.3,
    fiber: 0,
    servingSize: "100",
    servingUnit: "g",
  },
  {
    id: "8",
    name: "Broccoli",
    calories: 34,
    protein: 2.8,
    carbs: 7,
    fat: 0.4,
    fiber: 2.6,
    servingSize: "100",
    servingUnit: "g",
  },
  {
    id: "9",
    name: "Eggs",
    brand: "Large",
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    fiber: 0,
    servingSize: "2",
    servingUnit: "eggs",
  },
  {
    id: "10",
    name: "Sweet Potato",
    calories: 86,
    protein: 1.6,
    carbs: 20,
    fat: 0.1,
    fiber: 3,
    servingSize: "100",
    servingUnit: "g",
  },
  {
    id: "11",
    name: "Oatmeal",
    brand: "Rolled Oats",
    calories: 389,
    protein: 17,
    carbs: 66,
    fat: 7,
    fiber: 11,
    servingSize: "100",
    servingUnit: "g",
  },
  {
    id: "12",
    name: "Spinach",
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    fiber: 2.2,
    servingSize: "100",
    servingUnit: "g",
  },
];
