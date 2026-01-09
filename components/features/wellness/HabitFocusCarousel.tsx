import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Sparkles, Footprints, Droplets, Moon, Brain } from "lucide-react-native";
import colors from "@/constants/colors";
import type { HealthMetrics, HealthHistory, WellnessCheckIn } from "@/types/health";

interface HabitFocusCarouselProps {
  metrics?: HealthMetrics | null;
  history: HealthHistory[];
  checkIns: WellnessCheckIn[];
  hydrationTarget: number;
}

interface HabitCard {
  key: string;
  title: string;
  description: string;
  progress: number;
  icon: React.ReactNode;
  metricLabel: string;
  highlight: string;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const HabitFocusCarousel: React.FC<HabitFocusCarouselProps> = ({ metrics, history, checkIns, hydrationTarget }) => {
  const today = React.useMemo(() => new Date().toISOString().split("T")[0], []);

  const lastCheckIn = React.useMemo(() => checkIns.find((entry) => entry.date === today), [checkIns, today]);

  const weeklyCheckInCount = React.useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const start = weekAgo.toISOString().split("T")[0];
    return checkIns.filter((entry) => entry.date >= start && entry.date <= today).length;
  }, [checkIns, today]);

  const recentSleepAverage = React.useMemo(() => {
    if (!history.length) {
      return metrics?.sleep ?? 0;
    }
    const recent = history
      .slice()
      .sort((a, b) => (a.date > b.date ? -1 : 1))
      .slice(0, 5)
      .map((entry) => entry.metrics.sleep ?? metrics?.sleep ?? 0);
    if (!recent.length) {
      return metrics?.sleep ?? 0;
    }
    return recent.reduce((sum, value) => sum + value, 0) / recent.length;
  }, [history, metrics?.sleep]);

  const cards = React.useMemo<HabitCard[]>(() => {
    const stepsTarget = 8500;
    const sleepTarget = 8;

    const stepsProgress = clamp((metrics?.steps ?? 0) / stepsTarget, 0, 1);
    const hydrationProgress = clamp((metrics?.water ?? 0) / hydrationTarget, 0, 1);
    const sleepProgress = clamp((metrics?.sleep ?? recentSleepAverage) / sleepTarget, 0, 1);
    const reflectionProgress = lastCheckIn ? 1 : clamp(weeklyCheckInCount / 3, 0, 1);

    return [
      {
        key: "move",
        title: "Intentional Movement",
        description: stepsProgress >= 1 ? "Steps goal smashed — consider mobility work" : "Stack mini-walks to stay energized",
        progress: stepsProgress,
        icon: <Footprints size={22} color={colors.surface} strokeWidth={2.5} />,
        metricLabel: `${Math.min(metrics?.steps ?? 0, stepsTarget).toLocaleString()}/${stepsTarget.toLocaleString()} steps`,
        highlight: stepsProgress >= 1 ? "High energy" : stepsProgress >= 0.5 ? "On track" : "Needs boost",
      },
      {
        key: "hydrate",
        title: "Hydration Ritual",
        description:
          hydrationProgress >= 1
            ? "Hydration is dialed in — keep the flow"
            : "Add a glass with your next deep work block",
        progress: hydrationProgress,
        icon: <Droplets size={22} color={colors.surface} strokeWidth={2.5} />,
        metricLabel: `${(metrics?.water ?? 0).toFixed(1)}/${hydrationTarget.toFixed(1)} L`,
        highlight: hydrationProgress >= 0.85 ? "Optimized" : hydrationProgress >= 0.5 ? "Improving" : "Refocus",
      },
      {
        key: "recharge",
        title: "Night Recharge",
        description:
          sleepProgress >= 1
            ? "Deep rest achieved — ride that clarity"
            : "Plan a calming pre-sleep ritual tonight",
        progress: sleepProgress,
        icon: <Moon size={22} color={colors.surface} strokeWidth={2.5} />,
        metricLabel: `${(metrics?.sleep ?? recentSleepAverage).toFixed(1)}/${sleepTarget} h avg`,
        highlight: sleepProgress >= 0.85 ? "Rested" : sleepProgress >= 0.6 ? "Stabilizing" : "Recharge",
      },
      {
        key: "reflect",
        title: "Mindful Check-In",
        description: lastCheckIn
          ? "Reflection logged — capture what felt great"
          : "Tap a quick check-in to scan your mood",
        progress: reflectionProgress,
        icon: <Brain size={22} color={colors.surface} strokeWidth={2.5} />,
        metricLabel: lastCheckIn ? "Today logged" : `${weeklyCheckInCount} this week`,
        highlight: reflectionProgress >= 1 ? "Present" : reflectionProgress >= 0.5 ? "Almost there" : "Reconnect",
      },
    ];
  }, [metrics, hydrationTarget, recentSleepAverage, lastCheckIn, weeklyCheckInCount]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Today&apos;s Habit Focus</Text>
          <Text style={styles.subtitle}>Micro-habits that reinforce your momentum</Text>
        </View>
        <Sparkles size={20} color={colors.primary} strokeWidth={2.5} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cards.map((card) => (
          <View key={card.key} style={styles.card}>
            <View style={styles.iconBadge}>{card.icon}</View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.highlight}>{card.highlight}</Text>
            <Text style={styles.description}>{card.description}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${card.progress * 100}%` }]} />
            </View>
            <Text style={styles.metricLabel}>{card.metricLabel}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 20,
    paddingLeft: 20,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingRight: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  scrollContent: {
    paddingRight: 12,
    gap: 14,
  },
  card: {
    width: 220,
    padding: 16,
    backgroundColor: colors.surfaceLight,
    borderRadius: 18,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.text,
  },
  highlight: {
    marginTop: 4,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  description: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 18,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  metricLabel: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default HabitFocusCarousel;
