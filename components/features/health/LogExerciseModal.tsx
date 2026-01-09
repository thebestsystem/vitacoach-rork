import { X } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from "react-native";
import colors from "@/constants/colors";
import type { ExerciseLog } from "@/types/health";
import { useRouter } from "expo-router";
import { QuotaExceededError } from "@/utils/errors";

interface LogExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (log: ExerciseLog) => Promise<void>;
}

export default function LogExerciseModal({ visible, onClose, onSave }: LogExerciseModalProps) {
  const router = useRouter();
  const [type, setType] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [intensity, setIntensity] = useState<"low" | "medium" | "high">("medium");
  const [notes, setNotes] = useState<string>("");

  const handleSave = async () => {
    if (!type.trim() || !duration.trim()) {
      return;
    }

    const log: ExerciseLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: type.trim(),
      duration: parseFloat(duration) || 0,
      calories: calories ? parseFloat(calories) : undefined,
      intensity,
      notes: notes.trim() || undefined,
    };

    try {
      await onSave(log);
      setType("");
      setDuration("");
      setCalories("");
      setIntensity("medium");
      setNotes("");
      onClose();
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        onClose();
        Alert.alert(
          "Limit Reached",
          "You have reached your daily limit for exercise logs. Upgrade to Premium for unlimited logging.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Upgrade", onPress: () => router.push("/(tabs)/subscription" as any) }
          ]
        );
      } else {
        Alert.alert("Error", "Failed to save exercise log. Please try again.");
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Exercise</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="close-modal">
              <X size={24} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Exercise Type *</Text>
              <TextInput
                style={styles.input}
                value={type}
                onChangeText={setType}
                placeholder="e.g., Running, Yoga, Cycling"
                placeholderTextColor={colors.textTertiary}
                testID="exercise-type-input"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Duration (minutes) *</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="30"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                testID="duration-input"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Calories Burned</Text>
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>Intensity</Text>
              <View style={styles.intensityButtons}>
                <TouchableOpacity
                  style={[styles.intensityButton, intensity === "low" && styles.intensityButtonActive]}
                  onPress={() => setIntensity("low")}
                  testID="intensity-low"
                >
                  <Text style={[styles.intensityText, intensity === "low" && styles.intensityTextActive]}>
                    Low
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.intensityButton, intensity === "medium" && styles.intensityButtonActive]}
                  onPress={() => setIntensity("medium")}
                  testID="intensity-medium"
                >
                  <Text style={[styles.intensityText, intensity === "medium" && styles.intensityTextActive]}>
                    Medium
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.intensityButton, intensity === "high" && styles.intensityButtonActive]}
                  onPress={() => setIntensity("high")}
                  testID="intensity-high"
                >
                  <Text style={[styles.intensityText, intensity === "high" && styles.intensityTextActive]}>
                    High
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How did it feel?"
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
              style={[styles.button, styles.buttonPrimary, (!type.trim() || !duration.trim()) && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={!type.trim() || !duration.trim()}
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
  intensityButtons: {
    flexDirection: "row" as const,
    gap: 12,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center" as const,
  },
  intensityButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  intensityText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  intensityTextActive: {
    color: colors.primary,
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
