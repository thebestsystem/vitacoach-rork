import { describe, it, expect } from 'vitest';
import { deriveIngredients } from './shoppingList';

describe('deriveIngredients', () => {
    it('should derive ingredients for "Chicken Salad"', () => {
        const ingredients = deriveIngredients("Chicken Salad");
        expect(ingredients).toEqual(expect.arrayContaining([
            { name: "Chicken Breast", category: "Meat", amount: "500g" },
            { name: "Mixed Greens", category: "Produce", amount: "1 bag" },
            { name: "Olive Oil", category: "Pantry", amount: "2 tbsp" },
        ]));
    });

    it('should derive ingredients for "Spaghetti Carbonara"', () => {
        const ingredients = deriveIngredients("Spaghetti Carbonara");
        expect(ingredients).toEqual(expect.arrayContaining([
            { name: "Spaghetti", category: "Pasta & Grains", amount: "500g" },
            { name: "Pancetta", category: "Meat", amount: "200g" },
            { name: "Eggs", category: "Dairy & Eggs", amount: "4 large" },
        ]));
    });

    it('should provide default ingredients for unknown meal', () => {
        const ingredients = deriveIngredients("Mystery Meal");
        expect(ingredients).toEqual(expect.arrayContaining([
            { name: "Mystery Meal", category: "Other", amount: "1 serving" },
            { name: "Salt & Pepper", category: "Pantry", amount: "pinch" },
        ]));
    });

    it('should handle keywords (e.g., Salmon Salad)', () => {
        const ingredients = deriveIngredients("Salmon Salad");
        expect(ingredients).toEqual(expect.arrayContaining([
            { name: "Salmon Fillet", category: "Seafood", amount: "2 fillets" },
            { name: "Mixed Greens", category: "Produce", amount: "1 bag" },
            { name: "Olive Oil", category: "Pantry", amount: "1 tbsp" }
        ]));
    });

    it('should handle plural keywords (e.g., Apple Pie)', () => {
        const ingredients = deriveIngredients("Apple Pie");
        expect(ingredients).toEqual(expect.arrayContaining([
            { name: "Apples", category: "Produce", amount: "4 whole" }
        ]));
    });
});
