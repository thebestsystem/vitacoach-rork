
import { describe, it, expect } from 'vitest';
import { deriveIngredients, mergeShoppingLists } from '../utils/shoppingList';
import { ShoppingItem } from '../types/health';

describe('Shopping List Logic', () => {
    describe('deriveIngredients', () => {
        it('should handle known recipes', () => {
            const ingredients = deriveIngredients('Spaghetti Carbonara');
            expect(ingredients).toHaveLength(5);
            expect(ingredients[0].name).toBe('Spaghetti');
        });

        it('should handle keywords', () => {
            const ingredients = deriveIngredients('Grilled Chicken with Rice');
            const names = ingredients.map(i => i.name);
            expect(names).toContain('Chicken Breast');
            expect(names).toContain('Basmati Rice');
        });

        it('should parse explicit quantities', () => {
             const ingredients = deriveIngredients('200g Chicken');
             const chicken = ingredients.find(i => i.name === 'Chicken Breast');
             expect(chicken).toBeDefined();
             expect(chicken?.amount).toBe('200g');
        });

        it('should parse fractional quantities', () => {
             const ingredients = deriveIngredients('0.5kg Beef');
             const beef = ingredients.find(i => i.name === 'Ground Beef');
             expect(beef).toBeDefined();
             expect(beef?.amount).toBe('0.5kg');
        });

         it('should parse unit quantities', () => {
             const ingredients = deriveIngredients('2 slices Bread');
             const bread = ingredients.find(i => i.name === 'Whole Wheat Bread');
             expect(bread).toBeDefined();
             expect(bread?.amount).toBe('2 slices');
        });

        it('should fallback for unknown meals', () => {
             const ingredients = deriveIngredients('Unknown Alien Food');
             expect(ingredients).toHaveLength(2); // Meal itself + Salt & Pepper
             expect(ingredients[0].name).toBe('Unknown Alien Food');
             expect(ingredients[1].name).toBe('Salt & Pepper');
        });

        it('should deduplicate ingredients', () => {
             const ingredients = deriveIngredients('Chicken Chicken');
             expect(ingredients).toHaveLength(2); // Chicken + Olive Oil
             const chickens = ingredients.filter(i => i.name === 'Chicken Breast');
             expect(chickens).toHaveLength(1);
        });
    });

    describe('Merge Logic', () => {
        it('should merge new items', () => {
            const current: ShoppingItem[] = [];
            const newItems: ShoppingItem[] = [{ id: '1', name: 'A', category: 'C', amount: '1', checked: false }];

            const result = mergeShoppingLists(current, newItems);
            expect(result.hasChanges).toBe(true);
            expect(result.list).toHaveLength(1);
        });

        it('should update amount but preserve checked status', () => {
            const current: ShoppingItem[] = [{ id: '1', name: 'A', category: 'C', amount: '1', checked: true }];
            const newItems: ShoppingItem[] = [{ id: '1', name: 'A', category: 'C', amount: '2', checked: false }];

            const result = mergeShoppingLists(current, newItems);
            expect(result.hasChanges).toBe(true);
            expect(result.list[0].amount).toBe('2');
            expect(result.list[0].checked).toBe(true);
        });

        it('should not update if amount is same', () => {
             const current: ShoppingItem[] = [{ id: '1', name: 'A', category: 'C', amount: '1', checked: true }];
             const newItems: ShoppingItem[] = [{ id: '1', name: 'A', category: 'C', amount: '1', checked: false }];

             const result = mergeShoppingLists(current, newItems);
             expect(result.hasChanges).toBe(false);
             expect(result.list[0].checked).toBe(true);
        });
    });
});
