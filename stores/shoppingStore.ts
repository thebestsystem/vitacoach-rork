import { create } from 'zustand';
import { ShoppingItem } from '@/types/health';
import { syncPartialHealthData } from '@/utils/firestore';
import { mergeShoppingLists } from '@/utils/shoppingList';
import { handleFirebaseError } from '@/utils/firebaseErrors';

interface ShoppingState {
  shoppingList: ShoppingItem[];
  setShoppingList: (items: ShoppingItem[]) => void;
  toggleShoppingItem: (id: string, userId?: string) => Promise<void>;
  addToShoppingList: (items: ShoppingItem[], userId?: string) => Promise<void>;
  updateShoppingList: (items: ShoppingItem[], userId?: string) => Promise<void>;
  removeShoppingItems: (ids: string[], userId?: string) => Promise<void>;
}

export const useShoppingStore = create<ShoppingState>((set, get) => ({
  shoppingList: [],

  setShoppingList: (items) => set({ shoppingList: items }),

  toggleShoppingItem: async (id, userId) => {
    const { shoppingList } = get();
    const updated = shoppingList.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    set({ shoppingList: updated });

    if (userId) {
      try {
        await syncPartialHealthData(userId, {
          shoppingList: updated,
        });
      } catch (error) {
        handleFirebaseError(error, 'toggleShoppingItem', { userId });
      }
    }
  },

  addToShoppingList: async (items, userId) => {
    const { shoppingList } = get();
    // Avoid duplicates by ID
    const existingIds = new Set(shoppingList.map((i) => i.id));
    const newItems = items.filter((i) => !existingIds.has(i.id));

    if (newItems.length === 0) return;

    const updated = [...shoppingList, ...newItems];
    set({ shoppingList: updated });

    if (userId) {
      try {
        await syncPartialHealthData(userId, {
          shoppingList: updated,
        });
      } catch (error) {
        handleFirebaseError(error, 'addToShoppingList', { userId });
      }
    }
  },

  updateShoppingList: async (items, userId) => {
    const { shoppingList } = get();
    const { hasChanges, list: updated } = mergeShoppingLists(shoppingList, items);

    if (!hasChanges) return;

    set({ shoppingList: updated });

    if (userId) {
      try {
        await syncPartialHealthData(userId, {
          shoppingList: updated,
        });
      } catch (error) {
        handleFirebaseError(error, 'updateShoppingList', { userId });
      }
    }
  },

  removeShoppingItems: async (ids, userId) => {
    const { shoppingList } = get();
    const updated = shoppingList.filter((item) => !ids.includes(item.id));
    set({ shoppingList: updated });

    if (userId) {
      try {
        await syncPartialHealthData(userId, {
          shoppingList: updated,
        });
      } catch (error) {
        handleFirebaseError(error, 'removeShoppingItems', { userId });
      }
    }
  },
}));
