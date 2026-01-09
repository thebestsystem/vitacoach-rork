import { X, Smile, Meh, Frown } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from "react-native";
import colors from "@/constants/colors";
import type { WellnessCheckIn, MoodLevel } from "@/types/health";
import { useRouter } from "expo-router";
import { QuotaExceededError } from "@/utils/errors";

interface WellnessCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (checkIn: WellnessCheckIn) => Promise<void>;
}

export default function WellnessCheckInModal({ visible, onClose, onSave }: WellnessCheckInModalProps) {
  const router = useRouter();
  const [mood, setMood] = useState<MoodLevel>("good");
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [sleepQuality, setSleepQuality] = useState<number>(7);
  const [notes, setNotes] = useState<string>("");

  const handleSave = async () => {
    const checkIn: WellnessCheckIn = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood,
      stressLevel,
      energyLevel,
      sleepQuality,
      notes: notes.trim() || undefined,
    };

    try {
      await onSave(checkIn);
      setMood("good");
      setStressLevel(3);
      setEnergyLevel(5);
      setSleepQuality(7);
      setNotes("");
      onClose();
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        onClose();
        Alert.alert(
          "Limit Reached",
          "You have reached your daily limit for wellness check-ins. Upgrade to Premium for unlimited check-ins.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Upgrade", onPress: () => router.push("/(tabs)/subscription" as any) }
          ]
        );
      } else {
        Alert.alert("Error", "Failed to save wellness check-in. Please try again.");
      }
    }
  };

  const moods: { value: MoodLevel; label: string; emoji: string; icon: React.ReactNode }[] = [
    { value: "excellent", label: "Excellent", emoji: "😄", icon: <Smile size={20} color={colors.success} strokeWidth={2} /> },
    { value: "good", label: "Good", emoji: "😊", icon: <Smile size={20} color={colors.primary} strokeWidth={2} /> },
    { value: "okay", label: "Okay", emoji: "😐", icon: <Meh size={20} color={colors.warning} strokeWidth={2} /> },
    { value: "low", label: "Low", emoji: "😔", icon: <Frown size={20} color={colors.error} strokeWidth={2} /> },
    { value: "struggling", label: "Struggling", emoji: "😢", icon: <Frown size={20} color={colors.error} strokeWidth={2} /> },
  ];

  const renderSlider = (value: number, setValue: (val: number) => void, max: number, label: string, testId: string) => {
    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{label}</Text>
          <Text style={styles.sliderValue}>{value}</Text>
        </View>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${(value / max) * 100}%` }]} />
        </View>
        <View style={styles.sliderButtons}>
          {[...Array(max + 1)].map((_, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.sliderButton, value === i && styles.sliderButtonActive]}
              onPress={() => setValue(i)}
              testID={`${testId}-${i}`}
            >
              <Text style={[styles.sliderButtonText, value === i && styles.sliderButtonTextActive]}>
                {i}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Daily Check-In</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="close-modal">
              <X size={24} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>How are you feeling today?</Text>
              <View style={styles.moodButtons}>
                {moods.map((moodOption) => (
                  <TouchableOpacity
                    key={moodOption.value}
                    style={[styles.moodButton, mood === moodOption.value && styles.moodButtonActive]}
                    onPress={() => setMood(moodOption.value)}
                    testID={`mood-${moodOption.value}`}
                  >
                    <Text style={styles.moodEmoji}>{moodOption.emoji}</Text>
                    <Text style={[styles.moodText, mood === moodOption.value && styles.moodTextActive]}>
                      {moodOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderSlider(stressLevel, setStressLevel, 10, "Stress Level", "stress")}
            {renderSlider(energyLevel, setEnergyLevel, 10, "Energy Level", "energy")}
            {renderSlider(sleepQuality, setSleepQuality, 10, "Sleep Quality", "sleep-quality")}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How are you feeling? Any concerns?"
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
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSave}
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
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 12,
  },
  moodButtons: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
  },
  moodButton: {
    width: "30%" as const,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center" as const,
  },
  moodButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  moodTextActive: {
    color: colors.primary,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.text,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: "hidden" as const,
    marginBottom: 12,
  },
  sliderFill: {
    height: "100%" as const,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  sliderButtons: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    gap: 4,
  },
  sliderButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: "center" as const,
  },
  sliderButtonActive: {
    backgroundColor: colors.primary,
  },
  sliderButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  sliderButtonTextActive: {
    color: colors.surface,
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
