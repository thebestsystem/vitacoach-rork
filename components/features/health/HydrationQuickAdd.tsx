import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Droplet, Plus } from "lucide-react-native";
import colors from "@/constants/colors";
import { selectionFeedback } from "@/utils/haptics";

interface HydrationQuickAddProps {
  total: number;
  target?: number;
  onAdd: (amount: number) => Promise<void> | void;
}

const HYDRATION_PRESETS = [0.25, 0.5, 0.75, 1];

const HydrationQuickAdd: React.FC<HydrationQuickAddProps> = ({ total, target = 2.5, onAdd }) => {
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const progress = useMemo(() => {
    if (!target) {
      return 0;
    }
    return Math.min(total / target, 1);
  }, [total, target]);

  const hydrationMessage = useMemo(() => {
    if (progress >= 1) {
      return "Hydration target met 🎉";
    }
    if (progress >= 0.7) {
      return "Just a little more to go!";
    }
    if (progress >= 0.4) {
      return "Keep sipping throughout the day.";
    }
    return "Time for a refreshing sip.";
  }, [progress]);

  const handleAdd = async (amount: number) => {
    selectionFeedback();
    setPendingAmount(amount);
    try {
      await Promise.resolve(onAdd(amount));
    } finally {
      setPendingAmount(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <View style={styles.iconWrapper}>
            <Droplet size={18} color={colors.primary} strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>Hydration</Text>
        </View>
        <Text style={styles.total}>
          {total.toFixed(2)}L <Text style={styles.targetText}>/ {target.toFixed(1)}L</Text>
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={styles.subtitle}>{hydrationMessage}</Text>

      <View style={styles.buttonRow}>
        {HYDRATION_PRESETS.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={styles.presetButton}
            onPress={() => handleAdd(amount)}
            disabled={pendingAmount !== null}
            testID={`hydration-add-${amount}`}
          >
            {pendingAmount === amount ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Plus size={14} color={colors.primary} strokeWidth={2.4} />
                <Text style={styles.presetText}>{Math.round(amount * 1000)}ml</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default HydrationQuickAdd;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  headerTitle: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary + "15",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  title: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
  },
  total: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  targetText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden" as const,
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    gap: 12,
  },
  presetButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + "12",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
  },
  presetText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
});
