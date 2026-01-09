import { X } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from "react-native";
import colors from "@/constants/colors";
import type { MealLog } from "@/types/health";
import { useRouter } from "expo-router";
import { QuotaExceededError } from "@/utils/errors";

interface LogMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (log: MealLog) => Promise<void>;
}

export default function LogMealModal({ visible, onClose, onSave }: LogMealModalProps) {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fats, setFats] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    const log: MealLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mealType,
      name: name.trim(),
      calories: calories ? parseFloat(calories) : undefined,
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fats: fats ? parseFloat(fats) : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await onSave(log);
      setName("");
      setMealType("breakfast");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
      setNotes("");
      onClose();
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        onClose();
        Alert.alert(
          "Limit Reached",
          "You have reached your daily limit for meal logs. Upgrade to Premium for unlimited logging.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Upgrade", onPress: () => router.push("/(tabs)/subscription" as any) }
          ]
        );
      } else {
        Alert.alert("Error", "Failed to save meal log. Please try again.");
      }
    }
  };

  const mealTypes: ("breakfast" | "lunch" | "dinner" | "snack")[] = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Meal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="close-modal">
              <X size={24} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Meal Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Greek Salad"
                placeholderTextColor={colors.textTertiary}
                testID="meal-name-input"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Meal Type</Text>
              <View style={styles.mealTypeButtons}>
                {mealTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.mealTypeButton, mealType === type && styles.mealTypeButtonActive]}
                    onPress={() => setMealType(type)}
                    testID={`meal-type-${type}`}
                  >
                    <Text style={[styles.mealTypeText, mealType === type && styles.mealTypeTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Calories</Text>
              <TextInput
                style={styles.input}
                value={calories}
                onChangeText={setCalories}
                placeholder="Optional"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                testID="calories-input"
              />
            </View>

            <View style={styles.macrosRow}>
              <View style={styles.macroInput}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  testID="protein-input"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.label}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  value={carbs}
                  onChangeText={setCarbs}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  testID="carbs-input"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.label}>Fats (g)</Text>
                <TextInput
                  style={styles.input}
                  value={fats}
                  onChangeText={setFats}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  testID="fats-input"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ingredients, recipe, etc."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                testID="notes-input"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              testID="cancel-button"
            >
              <Text style={styles.buttonTextSecondary}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, !name.trim() && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={!name.trim()}
              testID="save-button"
            >
              <Text style={styles.buttonTextPrimary}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top" as const,
  },
  mealTypeButtons: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  mealTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center" as const,
  },
  mealTypeButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  mealTypeTextActive: {
    color: colors.primary,
  },
  macrosRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 20,
  },
  macroInput: {
    flex: 1,
  },
  modalActions: {
    flexDirection: "row" as const,
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  buttonSecondary: {
    backgroundColor: colors.background,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.surface,
  },
});
