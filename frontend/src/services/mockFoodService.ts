import type { Food } from '@types';
import { foodDatabase } from '@constants';

export const mockFoodService = {
    async searchFoods(query: string): Promise<Food[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const results = foodDatabase.filter(
                    (food) =>
                        food.name.toLowerCase().includes(query.toLowerCase()) ||
                        (food.brand &&
                            food.brand.toLowerCase().includes(query.toLowerCase()))
                );
                resolve(results);
            }, 300);
        });
    },

    async getFoodById(id: string): Promise<Food> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const food = foodDatabase.find((f) => f.id === id);
                if (!food) reject({ message: 'Food not found' });
                resolve(food as Food);
            }, 200);
        });
    },

    async getAllFoods(): Promise<Food[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(foodDatabase);
            }, 200);
        });
    },
};