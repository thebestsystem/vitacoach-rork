import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Alert
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ShoppingCart, Share, Trash2 } from "lucide-react-native";
import colors from "@/constants/colors";
import { useHealth } from "@/contexts/HealthContext";
import { ShoppingItem } from "@/types/health";
import { deriveIngredients } from "@/utils/shoppingList";

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mealPlans, shoppingList, toggleShoppingItem, addToShoppingList, updateShoppingList, removeShoppingItems } = useHealth();

  const syncFromMealPlans = () => {
    const itemMap = new Map<string, ShoppingItem>();

    mealPlans.forEach(plan => {
      plan.meals.forEach(meal => {
        const ingredients = deriveIngredients(meal.name);
        ingredients.forEach(ing => {
            const key = ing.name.toLowerCase();
            const id = `ing-${key.replace(/\s+/g, '-')}`;

            if (itemMap.has(id)) {
                // Smart merge: Append amount if it looks different
                const existing = itemMap.get(id)!;
                if (!existing.amount.includes(ing.amount)) {
                    // Simple heuristic: if amounts differ significantly, append.
                    // Ideally we'd parse units, but appending is safer than overwriting or ignoring.
                    existing.amount = `${existing.amount}, ${ing.amount}`;
                }
            } else {
                itemMap.set(id, {
                    id: id,
                    name: ing.name,
                    category: ing.category,
                    amount: ing.amount,
                    checked: false
                });
            }
        });
      });
    });

    updateShoppingList(Array.from(itemMap.values()));
    Alert.alert("Synced", "Shopping list updated from meal plans.");
  };

  const sections = useMemo(() => {
    const grouped: { [key: string]: ShoppingItem[] } = {};
    shoppingList.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
    });

    return Object.entries(grouped).map(([title, data]) => ({
        title,
        data
    })).sort((a, b) => a.title.localeCompare(b.title));
  }, [shoppingList]);

  const handleClearChecked = () => {
    const checkedIds = shoppingList.filter(i => i.checked).map(i => i.id);
    if (checkedIds.length === 0) return;
    Alert.alert(
        "Clear Checked Items",
        "Are you sure you want to remove all checked items?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Clear", style: "destructive", onPress: () => removeShoppingItems(checkedIds) }
        ]
    );
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => {
    return (
        <TouchableOpacity
            style={[styles.itemRow, item.checked && styles.itemRowChecked]}
            onPress={() => toggleShoppingItem(item.id)}
            activeOpacity={0.7}
        >
            <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                {item.checked && <Check size={14} color="#FFF" />}
            </View>
            <View style={styles.itemInfo}>
                <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>{item.name}</Text>
                <Text style={styles.itemAmount}>{item.amount}</Text>
            </View>
        </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
        <Stack.Screen
            options={{
                headerShown: true,
                title: "Shopping List",
                headerRight: () => (
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <TouchableOpacity onPress={syncFromMealPlans}>
                            <ShoppingCart size={24} color={colors.primary} />
                        </TouchableOpacity>
                        {shoppingList.some(i => i.checked) && (
                             <TouchableOpacity onPress={handleClearChecked}>
                                <Trash2 size={24} color={colors.error} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => { /* Share logic */ }}>
                            <Share size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                )
            }}
        />

        {shoppingList.length === 0 ? (
            <View style={styles.emptyState}>
                <ShoppingCart size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Shopping List Empty</Text>
                <Text style={styles.emptyText}>Sync from your meal plans or add items manually.</Text>
                {mealPlans.length > 0 && (
                    <TouchableOpacity style={styles.syncButton} onPress={syncFromMealPlans}>
                        <Text style={styles.syncButtonText}>Sync from Meal Plans</Text>
                    </TouchableOpacity>
                )}
            </View>
        ) : (
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                style={styles.list}
            />
        )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  itemRowChecked: {
    backgroundColor: colors.background,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  itemNameChecked: {
    textDecorationLine: "line-through",
    color: colors.textTertiary,
  },
  itemAmount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
  },
  syncButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  syncButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
