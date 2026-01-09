import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Footprints, Moon, Smile } from "lucide-react-native";
import colors from "@/constants/colors";
import type { HealthHistory, WellnessCheckIn, MoodLevel } from "@/types/health";

interface WeeklyWellnessSnapshotProps {
  history: HealthHistory[];
  checkIns: WellnessCheckIn[];
}

type TrendDescriptor = {
  label: string;
  current: number;
  previous: number | null;
  unit?: string;
  icon: React.ReactNode;
  formatter?: (value: number) => string;
};

const moodScores: Record<MoodLevel, number> = {
  excellent: 5,
  good: 4,
  okay: 3,
  low: 2,
  struggling: 1,
};

const scoreToMood: Record<number, string> = {
  5: "Excellent",
  4: "Great",
  3: "Stable",
  2: "Low",
  1: "Strained",
};

const WeeklyWellnessSnapshot: React.FC<WeeklyWellnessSnapshotProps> = ({ history, checkIns }) => {
  const last14DaysHistory = useMemo(() => {
    if (!history?.length) return [];
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

    return history.filter((entry) => new Date(entry.date) >= fourteenDaysAgo);
  }, [history]);

  const weeklyTrends = useMemo<TrendDescriptor[]>(() => {
    const today = new Date();
    const startCurrent = new Date(today);
    startCurrent.setDate(today.getDate() - 6);
    const startPrevious = new Date(today);
    startPrevious.setDate(today.getDate() - 13);
    const endPrevious = new Date(today);
    endPrevious.setDate(today.getDate() - 7);

    const isWithin = (date: Date, start: Date, end: Date) => date >= start && date <= end;

    const currentHistory = last14DaysHistory.filter((entry) =>
      new Date(entry.date) >= startCurrent
    );
    const previousHistory = last14DaysHistory.filter((entry) =>
      isWithin(new Date(entry.date), startPrevious, endPrevious)
    );

    const averageSteps = (entries: typeof last14DaysHistory) => {
      if (!entries.length) return null;
      const total = entries.reduce((sum, entry) => sum + (entry.metrics.steps || 0), 0);
      return total / entries.length;
    };

    const averageSleep = (entries: typeof last14DaysHistory) => {
      const filtered = entries.filter((entry) => entry.metrics.sleep);
      if (!filtered.length) return null;
      const total = filtered.reduce((sum, entry) => sum + (entry.metrics.sleep || 0), 0);
      return total / filtered.length;
    };

    const averageMoodScore = (dates: { date: string; mood: MoodLevel }[]) => {
      if (!dates.length) return null;
      const total = dates.reduce((sum, entry) => sum + moodScores[entry.mood], 0);
      return total / dates.length;
    };

    const currentCheckins = checkIns.filter((checkIn) => new Date(checkIn.date) >= startCurrent);
    const previousCheckins = checkIns.filter((checkIn) =>
      isWithin(new Date(checkIn.date), startPrevious, endPrevious)
    );

    const currentSteps = averageSteps(currentHistory);
    const previousSteps = averageSteps(previousHistory);
    const currentSleep = averageSleep(currentHistory);
    const previousSleep = averageSleep(previousHistory);
    const currentMood = averageMoodScore(currentCheckins);
    const previousMood = averageMoodScore(previousCheckins);

    const trends: TrendDescriptor[] = [
      {
        label: "Steps",
        current: currentSteps ?? 0,
        previous: previousSteps,
        unit: "",
        icon: <Footprints size={22} color={colors.primary} strokeWidth={2} />,
        formatter: (value) => Math.round(value).toLocaleString(),
      },
      {
        label: "Sleep",
        current: currentSleep ?? 0,
        previous: previousSleep,
        unit: "h",
        icon: <Moon size={22} color={colors.primaryLight} strokeWidth={2} />,
        formatter: (value) => value.toFixed(1),
      },
      {
        label: "Mood",
        current: currentMood ?? 0,
        previous: previousMood,
        icon: <Smile size={22} color={colors.accent} strokeWidth={2} />,
        formatter: (value) => scoreToMood[Math.round(value) as keyof typeof scoreToMood] || "--",
      },
    ];

    return trends;
  }, [checkIns, last14DaysHistory]);

  const focusArea = useMemo(() => {
    const computeChange = (trend: TrendDescriptor) => {
      if (trend.previous === null || trend.previous === 0) return 0;
      return ((trend.current - trend.previous) / trend.previous) * 100;
    };

    const sorted = weeklyTrends
      .map((trend) => ({ ...trend, change: computeChange(trend) }))
      .sort((a, b) => a.change - b.change);

    const lowest = sorted[0];
    if (!lowest) {
      return "Keep building healthy habits.";
    }

    if (lowest.change <= -8) {
      return `Focus on your ${lowest.label.toLowerCase()} this week.`;
    }

    if (lowest.change >= 5) {
      return "Momentum is on your side—keep it up!";
    }

    return `Nice consistency! Maintain your ${lowest.label.toLowerCase()} routine.`;
  }, [weeklyTrends]);

  const renderChange = (trend: TrendDescriptor) => {
    if (trend.previous === null || trend.previous === 0) {
      return <Text style={styles.neutralChange}>New data</Text>;
    }

    const change = ((trend.current - trend.previous) / trend.previous) * 100;
    if (!Number.isFinite(change)) {
      return <Text style={styles.neutralChange}>Stable</Text>;
    }

    if (change > 4) {
      return <Text style={styles.positiveChange}>▲ {Math.round(change)}%</Text>;
    }

    if (change < -4) {
      return <Text style={styles.negativeChange}>▼ {Math.abs(Math.round(change))}%</Text>;
    }

    return <Text style={styles.neutralChange}>≈ {Math.abs(Math.round(change))}%</Text>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Wellness Snapshot</Text>
        <Text style={styles.subtitle}>{focusArea}</Text>
      </View>

      <View style={styles.cardRow}>
        {weeklyTrends.map((trend) => (
          <View key={trend.label} style={styles.card}>
            <View style={styles.cardHeader}>
              {trend.icon}
              <Text style={styles.cardLabel}>{trend.label}</Text>
            </View>
            <Text style={styles.cardValue}>
              {trend.formatter ? trend.formatter(trend.current) : Math.round(trend.current)}
              {trend.unit}
            </Text>
            <View style={styles.changeRow}>{renderChange(trend)}</View>
            {trend.previous !== null && trend.previous !== undefined && (
              <Text style={styles.previousValue}>
                Prev: {trend.formatter ? trend.formatter(trend.previous) : Math.round(trend.previous)}
                {trend.unit}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default WeeklyWellnessSnapshot;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardRow: {
    flexDirection: "row" as const,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text,
  },
  changeRow: {
    height: 22,
    justifyContent: "center" as const,
  },
  previousValue: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  positiveChange: {
    color: colors.success,
    fontWeight: "600" as const,
    fontSize: 13,
  },
  negativeChange: {
    color: colors.warning,
    fontWeight: "600" as const,
    fontSize: 13,
  },
  neutralChange: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
