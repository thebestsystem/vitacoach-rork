import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import colors from "@/constants/colors";
import type { ReflectionMoodTag } from "@/types/health";

interface GuidedReflectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: {
    gratitude: string;
    challenge: string;
    intention: string;
    moodTag: ReflectionMoodTag;
    energyScore: number;
    clarityScore: number;
  }) => Promise<void> | void;
}

const moodOptions: Array<{ tag: ReflectionMoodTag; label: string; description: string }> = [
  { tag: "grounded", label: "Grounded", description: "Steady and centered" },
  { tag: "energized", label: "Energized", description: "Ready to take on the day" },
  { tag: "stretched", label: "Stretched", description: "At capacity but engaged" },
  { tag: "fatigued", label: "Fatigued", description: "Running on low battery" },
  { tag: "centered", label: "Centered", description: "Calmly focused" },
];

function RatingPill({ value, selected, onPress }: { value: number; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.ratingPill, selected && styles.ratingPillSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.ratingPillText, selected && styles.ratingPillTextSelected]}>{value}</Text>
    </TouchableOpacity>
  );
}

export default function GuidedReflectionModal({ visible, onClose, onSave }: GuidedReflectionModalProps) {
  const [gratitude, setGratitude] = useState("");
  const [challenge, setChallenge] = useState("");
  const [intention, setIntention] = useState("");
  const [moodTag, setMoodTag] = useState<ReflectionMoodTag>("grounded");
  const [energyScore, setEnergyScore] = useState<number>(3);
  const [clarityScore, setClarityScore] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setGratitude("");
      setChallenge("");
      setIntention("");
      setMoodTag("grounded");
      setEnergyScore(3);
      setClarityScore(3);
      setIsSaving(false);
    }
  }, [visible]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave({ gratitude, challenge, intention, moodTag, energyScore, clarityScore });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Guided Reflection</Text>
            <Text style={styles.subtitle}>Capture today&apos;s signal in under two minutes.</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.promptBlock}>
              <Text style={styles.promptLabel}>Gratitude</Text>
              <Text style={styles.promptHint}>What lifted you or made you smile today?</Text>
              <TextInput
                style={styles.input}
                placeholder="Quick gratitude note"
                placeholderTextColor={colors.textTertiary}
                value={gratitude}
                onChangeText={setGratitude}
                multiline
              />
            </View>

            <View style={styles.promptBlock}>
              <Text style={styles.promptLabel}>Micro-challenge</Text>
              <Text style={styles.promptHint}>Where did friction or stress show up?</Text>
              <TextInput
                style={styles.input}
                placeholder="Capture the rough edge"
                placeholderTextColor={colors.textTertiary}
                value={challenge}
                onChangeText={setChallenge}
                multiline
              />
            </View>

            <View style={styles.promptBlock}>
              <Text style={styles.promptLabel}>Intention</Text>
              <Text style={styles.promptHint}>What tiny move keeps you aligned tomorrow?</Text>
              <TextInput
                style={styles.input}
                placeholder="Set a bite-sized intention"
                placeholderTextColor={colors.textTertiary}
                value={intention}
                onChangeText={setIntention}
                multiline
              />
            </View>

            <View style={styles.promptBlock}>
              <Text style={styles.promptLabel}>How do you feel right now?</Text>
              <View style={styles.moodRow}>
                {moodOptions.map((option) => {
                  const selected = option.tag === moodTag;
                  return (
                    <TouchableOpacity
                      key={option.tag}
                      style={[styles.moodPill, selected && styles.moodPillSelected]}
                      onPress={() => setMoodTag(option.tag)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>{option.label}</Text>
                      <Text style={[styles.moodDescription, selected && styles.moodDescriptionSelected]}>
                        {option.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.promptBlock}>
              <Text style={styles.promptLabel}>Energy check-in</Text>
              <Text style={styles.promptHint}>1 = depleted · 5 = fully charged</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <RatingPill
                    key={`energy-${value}`}
                    value={value}
                    selected={energyScore === value}
                    onPress={() => setEnergyScore(value)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.promptBlock}>
              <Text style={styles.promptLabel}>Mental clarity</Text>
              <Text style={styles.promptHint}>1 = foggy · 5 = sharp</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <RatingPill
                    key={`clarity-${value}`}
                    value={value}
                    selected={clarityScore === value}
                    onPress={() => setClarityScore(value)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose} disabled={isSaving}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.primaryButtonText}>{isSaving ? "Saving..." : "Log reflection"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: "92%",
    width: "100%",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 24,
  },
  promptBlock: {
    marginBottom: 20,
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  promptHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.surfaceLight,
    color: colors.text,
    minHeight: 72,
    textAlignVertical: "top",
  },
  moodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  moodPill: {
    flexBasis: "48%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceLight,
  },
  moodPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  moodLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  moodLabelSelected: {
    color: colors.surface,
  },
  moodDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  moodDescriptionSelected: {
    color: colors.surface,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 12,
  },
  ratingPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceLight,
  },
  ratingPillSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryLight,
  },
  ratingPillText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  ratingPillTextSelected: {
    color: colors.surface,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 16,
    gap: 14,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },
});
