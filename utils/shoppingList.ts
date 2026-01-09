import { ShoppingItem } from "@/types/health";

export const deriveIngredients = (mealName: string): { name: string; category: string; amount: string }[] => {
  const normalizedName = mealName.toLowerCase().trim();

  // 1. Check for exact recipe matches
  if (MEAL_RECIPES[normalizedName]) {
    return MEAL_RECIPES[normalizedName];
  }

  const ingredients: { name: string; category: string; amount: string }[] = [];
  const words = normalizedName.split(/\s+/);

  // Helper to check if a word matches a quantity pattern
  const isQuantity = (word: string) => {
    // Matches patterns like: 200g, 0.5kg, 1, 1/2, 1-2, 2.5
    return /^(\d+(\.\d+)?|\d+\/\d+|\d+-\d+)([a-z]+)?$/.test(word);
  };

  // 2. Keyword matching with amount extraction
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Clean punctuation
    const cleanWord = word.replace(/[^a-z0-9.]/g, ''); // Keep numbers for quantity check inside word if attached
    const textOnly = cleanWord.replace(/[0-9.]/g, ''); // just text part
    const singular = textOnly.endsWith('s') ? textOnly.slice(0, -1) : textOnly;

    // Check if this word is a keyword
    let keywordEntry = KEYWORD_INGREDIENTS[textOnly] || KEYWORD_INGREDIENTS[singular];

    if (keywordEntry) {
        let amount = keywordEntry.amount;

        // Check previous word for quantity (e.g. "200g Chicken")
        if (i > 0) {
            const prev = words[i-1];
            if (isQuantity(prev)) {
                amount = prev;
            }
        }

        if (i > 0) {
            const prev = words[i-1];
            // Case: "200g Chicken"
            if (/^\d+(\.\d+)?[a-z]+$/.test(prev)) {
                amount = prev;
            }
            // Case: "2 slices Bread"
            else if (i > 1) {
                const prevPrev = words[i-2];
                if (/^\d+(\.\d+)?$/.test(prevPrev) && /^[a-z]+$/.test(prev)) {
                    // Check if prev is a likely unit
                     const units = ['g', 'kg', 'ml', 'l', 'oz', 'lb', 'cup', 'cups', 'tbsp', 'tsp', 'slice', 'slices', 'piece', 'pieces', 'fillet', 'fillets'];
                     if (units.includes(prev)) {
                         amount = `${prevPrev} ${prev}`;
                     }
                }
            }
        }

        ingredients.push({ ...keywordEntry, amount });
    }
  }

  // 3. Fallback/Defaults
  if (ingredients.length === 0) {
    ingredients.push({ name: mealName, category: "Other", amount: "1 serving" });
    ingredients.push({ name: "Salt & Pepper", category: "Pantry", amount: "pinch" });
  } else {
    // Add common staples if not present
    const hasOil = ingredients.some(i => i.name.toLowerCase().includes("oil"));
    if (!hasOil) {
         ingredients.push({ name: "Olive Oil", category: "Pantry", amount: "1 tbsp" });
    }
  }

  // Deduplicate by name
  const uniqueIngredients = ingredients.filter((item, index, self) =>
    index === self.findIndex((t) => (
      t.name === item.name
    ))
  );

  return uniqueIngredients;
};

export const mergeShoppingLists = (currentList: ShoppingItem[], newItems: ShoppingItem[]): { hasChanges: boolean; list: ShoppingItem[] } => {
    const itemMap = new Map(currentList.map((i) => [i.id, i]));
    let hasChanges = false;

    newItems.forEach((newItem) => {
        const existing = itemMap.get(newItem.id);
        if (existing) {
            // Merge logic: Update amount if changed, keep checked status
            if (existing.amount !== newItem.amount) {
                itemMap.set(newItem.id, { ...newItem, checked: existing.checked });
                hasChanges = true;
            }
        } else {
            itemMap.set(newItem.id, newItem);
            hasChanges = true;
        }
    });

    return {
        hasChanges,
        list: Array.from(itemMap.values())
    };
};

// A dictionary of common meals to specific ingredients
const MEAL_RECIPES: Record<string, { name: string; category: string; amount: string }[]> = {
  "chicken salad": [
    { name: "Chicken Breast", category: "Meat", amount: "500g" },
    { name: "Mixed Greens", category: "Produce", amount: "1 bag" },
    { name: "Cherry Tomatoes", category: "Produce", amount: "1 pack" },
    { name: "Cucumber", category: "Produce", amount: "1 whole" },
    { name: "Olive Oil", category: "Pantry", amount: "2 tbsp" },
    { name: "Balsamic Vinegar", category: "Pantry", amount: "1 tbsp" },
  ],
  "spaghetti carbonara": [
    { name: "Spaghetti", category: "Pasta & Grains", amount: "500g" },
    { name: "Pancetta", category: "Meat", amount: "200g" },
    { name: "Eggs", category: "Dairy & Eggs", amount: "4 large" },
    { name: "Parmesan Cheese", category: "Dairy & Eggs", amount: "100g" },
    { name: "Black Pepper", category: "Pantry", amount: "to taste" },
  ],
  "oatmeal with berries": [
    { name: "Rolled Oats", category: "Breakfast", amount: "1 cup" },
    { name: "Milk", category: "Dairy & Eggs", amount: "2 cups" },
    { name: "Mixed Berries", category: "Produce", amount: "1 cup" },
    { name: "Honey", category: "Pantry", amount: "1 tbsp" },
  ],
  "grilled salmon": [
    { name: "Salmon Fillet", category: "Seafood", amount: "2 fillets" },
    { name: "Lemon", category: "Produce", amount: "1 whole" },
    { name: "Asparagus", category: "Produce", amount: "1 bunch" },
    { name: "Olive Oil", category: "Pantry", amount: "1 tbsp" },
  ],
  "avocado toast": [
    { name: "Whole Wheat Bread", category: "Bakery", amount: "2 slices" },
    { name: "Avocado", category: "Produce", amount: "1 whole" },
    { name: "Red Pepper Flakes", category: "Pantry", amount: "pinch" },
    { name: "Lemon", category: "Produce", amount: "1 wedge" },
  ],
  "smoothie bowl": [
     { name: "Frozen Mixed Berries", category: "Frozen", amount: "1 cup" },
     { name: "Banana", category: "Produce", amount: "1 whole" },
     { name: "Almond Milk", category: "Dairy & Eggs", amount: "1/2 cup" },
     { name: "Granola", category: "Breakfast", amount: "1/4 cup" },
  ]
};

// Keyword mapping for fallback
const KEYWORD_INGREDIENTS: Record<string, { name: string; category: string; amount: string }> = {
  chicken: { name: "Chicken Breast", category: "Meat", amount: "500g" },
  beef: { name: "Ground Beef", category: "Meat", amount: "500g" },
  steak: { name: "Steak", category: "Meat", amount: "2 steaks" },
  pork: { name: "Pork Chops", category: "Meat", amount: "4 chops" },
  fish: { name: "White Fish Fillet", category: "Seafood", amount: "2 fillets" },
  salmon: { name: "Salmon Fillet", category: "Seafood", amount: "2 fillets" },
  tuna: { name: "Tuna Steaks", category: "Seafood", amount: "2 steaks" },
  shrimp: { name: "Shrimp", category: "Seafood", amount: "300g" },

  rice: { name: "Basmati Rice", category: "Pasta & Grains", amount: "500g" },
  pasta: { name: "Pasta", category: "Pasta & Grains", amount: "500g" },
  spaghetti: { name: "Spaghetti", category: "Pasta & Grains", amount: "500g" },
  noodles: { name: "Egg Noodles", category: "Pasta & Grains", amount: "1 pack" },
  quinoa: { name: "Quinoa", category: "Pasta & Grains", amount: "1 pack" },

  bread: { name: "Whole Wheat Bread", category: "Bakery", amount: "1 loaf" },
  toast: { name: "Bread", category: "Bakery", amount: "2 slices" },
  bagel: { name: "Bagels", category: "Bakery", amount: "1 pack" },

  egg: { name: "Eggs", category: "Dairy & Eggs", amount: "1 dozen" },
  eggs: { name: "Eggs", category: "Dairy & Eggs", amount: "1 dozen" },
  milk: { name: "Milk", category: "Dairy & Eggs", amount: "1L" },
  cheese: { name: "Cheddar Cheese", category: "Dairy & Eggs", amount: "200g" },
  yogurt: { name: "Greek Yogurt", category: "Dairy & Eggs", amount: "500g" },
  butter: { name: "Butter", category: "Dairy & Eggs", amount: "250g" },

  salad: { name: "Mixed Greens", category: "Produce", amount: "1 bag" },
  lettuce: { name: "Romaine Lettuce", category: "Produce", amount: "1 head" },
  spinach: { name: "Spinach", category: "Produce", amount: "1 bag" },
  kale: { name: "Kale", category: "Produce", amount: "1 bunch" },
  tomato: { name: "Tomatoes", category: "Produce", amount: "4 whole" },
  potato: { name: "Potatoes", category: "Produce", amount: "1kg" },
  carrot: { name: "Carrots", category: "Produce", amount: "1 bunch" },
  broccoli: { name: "Broccoli", category: "Produce", amount: "1 head" },
  onion: { name: "Onions", category: "Produce", amount: "3 whole" },
  garlic: { name: "Garlic", category: "Produce", amount: "1 bulb" },
  pepper: { name: "Bell Peppers", category: "Produce", amount: "2 whole" },
  mushroom: { name: "Mushrooms", category: "Produce", amount: "1 punnet" },

  apple: { name: "Apples", category: "Produce", amount: "4 whole" },
  banana: { name: "Bananas", category: "Produce", amount: "1 bunch" },
  berry: { name: "Mixed Berries", category: "Produce", amount: "1 punnet" },
  berries: { name: "Mixed Berries", category: "Produce", amount: "1 punnet" },
  orange: { name: "Oranges", category: "Produce", amount: "4 whole" },
  lemon: { name: "Lemons", category: "Produce", amount: "2 whole" },
  avocado: { name: "Avocado", category: "Produce", amount: "2 whole" },

  oil: { name: "Olive Oil", category: "Pantry", amount: "1 bottle" },
  sugar: { name: "Sugar", category: "Pantry", amount: "1 kg" },
  flour: { name: "Flour", category: "Pantry", amount: "1 kg" },
  salt: { name: "Salt", category: "Pantry", amount: "1 box" },
  coffee: { name: "Ground Coffee", category: "Pantry", amount: "1 bag" },
  tea: { name: "Tea Bags", category: "Pantry", amount: "1 box" },
};
