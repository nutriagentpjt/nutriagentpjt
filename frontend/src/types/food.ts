export interface Food {
  id: number | string;
  name: string;
  servingSize: number | string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  brand?: string;
  fiber?: number;
  servingUnit?: string;
}

export interface FoodSearchResponse {
  foods: Food[];
  total: number;
}
