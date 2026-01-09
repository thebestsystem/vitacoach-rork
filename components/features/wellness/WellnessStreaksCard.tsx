import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Flame, Moon, Droplet, Sparkles } from "lucide-react-native";
import colors from "@/constants/colors";
import type { HealthHistory, WellnessCheckIn } from "@/types/health";

interface WellnessStreaksCardProps {
  healthHistory: HealthHistory[];
  wellnessCheckIns: WellnessCheckIn[];
  hydrationTarget: number;
}

type HabitKey = "movement" | "sleep" | "hydration" | "mindfulness";

type HabitConfig = {
  key: HabitKey;
  title: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  meetsGoal: (metrics: HealthHistory["metrics"] | undefined, dateKey: string) => boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const getDateKey = (date: Date): string => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
};

const buildHistoryMap = (history: HealthHistory[]): Map<string, HealthHistory["metrics"]> => {
  return history.reduce((acc, entry) => {
    acc.set(entry.date, entry.metrics);
    return acc;
  }, new Map<string, HealthHistory["metrics"]>());
};

const calculateCurrentStreak = (
  evaluate: (dateKey: string) => boolean,
  lookbackDays = 30,
): number => {
  const today = new Date();
  let streak = 0;

  for (let i = 0; i < lookbackDays; i++) {
    const targetDate = new Date(today.getTime() - i * DAY_MS);
    const dateKey = getDateKey(targetDate);
    if (!evaluate(dateKey)) {
      break;
    }
    streak += 1;
  }

  return streak;
};

const calculateBestStreak = (
  evaluate: (dateKey: string) => boolean,
  lookbackDays = 60,
): number => {
  const today = new Date();
  let best = 0;
  let running = 0;

  for (let i = lookbackDays; i >= 0; i--) {
    const targetDate = new Date(today.getTime() - i * DAY_MS);
    const dateKey = getDateKey(targetDate);
    if (evaluate(dateKey)) {
      running += 1;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  }

  return best;
};

const calculateCompletionRate = (
  evaluate: (dateKey: string) => boolean,
  window = 7,
): number => {
  const today = new Date();
  let completed = 0;

  for (let i = 0; i < window; i++) {
    const targetDate = new Date(today.getTime() - i * DAY_MS);
    const dateKey = getDateKey(targetDate);
    if (evaluate(dateKey)) {
      completed += 1;
    }
  }

  return completed / window;
};

const buildSummaryMessage = (streak: number, completionRate: number): string => {
  if (streak >= 7) {
    return "Incredible consistency!";
  }
  if (streak >= 3) {
    return "Momentum is building.";
  }
  if (completionRate >= 0.6) {
    return "Almost there—keep at it.";
  }
  if (completionRate >= 0.3) {
    return "Small steps add up.";
  }
  return "Today is a great day to start.";
};

const WellnessStreaksCard: React.FC<WellnessStreaksCardProps> = ({
  healthHistory,
  wellnessCheckIns,
  hydrationTarget,
}) => {
  const historyMap = useMemo(() => buildHistoryMap(healthHistory), [healthHistory]);
  const checkInDates = useMemo(() => new Set(wellnessCheckIns.map((checkIn) => checkIn.date)), [wellnessCheckIns]);

  const habitConfigs = useMemo<HabitConfig[]>(
    () => [
      {
        key: "movement",
        title: "Daily Movement",
        description: "Walk at least 8k steps",
        icon: <Flame size={18} color={colors.primary} strokeWidth={2.4} />,
        color: colors.primary,
        meetsGoal: (metrics) => {
          if (!metrics?.steps) return false;
          return metrics.steps >= 8000;
        },
      },
      {
        key: "sleep",
        title: "Restful Sleep",
        description: "Sleep 7+ hours",
        icon: <Moon size={18} color={colors.info} strokeWidth={2.4} />,
        color: colors.info,
        meetsGoal: (metrics) => {
          if (!metrics?.sleep) return false;
          return metrics.sleep >= 7;
        },
      },
      {
        key: "hydration",
        title: "Hydration",
        description: `Drink ${hydrationTarget.toFixed(1)}L`,
        icon: <Droplet size={18} color={colors.primary} strokeWidth={2.4} />,
        color: colors.primary,
        meetsGoal: (metrics) => {
          if (!metrics?.water) return false;
          return metrics.water >= hydrationTarget;
        },
      },
      {
        key: "mindfulness",
        title: "Mindful Check-In",
        description: "Complete a wellness check-in",
        icon: <Sparkles size={18} color={colors.success} strokeWidth={2.4} />,
        color: colors.success,
        meetsGoal: (_, dateKey) => checkInDates.has(dateKey),
      },
    ],
    [checkInDates, hydrationTarget],
  );

  const habitSummaries = useMemo(() => {
    return habitConfigs.map((habit) => {
      const meetsGoalForDate = (dateKey: string) => {
        const metrics = historyMap.get(dateKey);
        return habit.meetsGoal(metrics, dateKey);
      };

      const currentStreak = calculateCurrentStreak(meetsGoalForDate);
      const bestStreak = calculateBestStreak(meetsGoalForDate);
      const completionRate = calculateCompletionRate(meetsGoalForDate);

      return {
        ...habit,
        currentStreak,
        bestStreak,
        completionRate,
        summary: buildSummaryMessage(currentStreak, completionRate),
      };
    });
  }, [habitConfigs, historyMap]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Habit Momentum</Text>
      <Text style={styles.subtitle}>Consistency unlocks lasting change—celebrate the wins and spot gaps early.</Text>

      {habitSummaries.map((habit) => (
        <View key={habit.key} style={styles.habitRow}>
          <View style={styles.iconBadge}>{habit.icon}</View>
          <View style={styles.habitContent}>
            <View style={styles.habitHeader}>
              <Text style={styles.habitTitle}>{habit.title}</Text>
              <Text style={[styles.streakText, { color: habit.color }]}>{habit.currentStreak} day{habit.currentStreak === 1 ? "" : "s"}</Text>
            </View>
            <Text style={styles.habitDescription}>{habit.description}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(habit.completionRate * 100, 100)}%`, backgroundColor: habit.color }]} />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Best streak: {habit.bestStreak} day{habit.bestStreak === 1 ? "" : "s"}</Text>
              <Text style={styles.metaText}>7-day: {Math.round(habit.completionRate * 100)}%</Text>
            </View>
            <Text style={styles.summaryText}>{habit.summary}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default WellnessStreaksCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 18,
    lineHeight: 20,
  },
  habitRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 14,
    marginBottom: 18,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary + "12",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  habitContent: {
    flex: 1,
  },
  habitHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 4,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  habitDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryText: {
    fontSize: 13,
    color: colors.text,
    marginTop: 8,
    fontWeight: "500" as const,
  },
});
