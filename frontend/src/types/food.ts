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
  sodium?: number;
  servingUnit?: string;
  weight?: number;
  variants?: number;
}

export interface FoodSearchResponse {
  foods: Food[];
  total: number;
}
