import { TrendingUp, Calendar, Zap } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useHealth } from "@/contexts/HealthContext";
import ProgressChart from "@/components/features/health/ProgressChart";

type TimePeriod = "7d" | "30d" | "all";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { healthHistory, exerciseLogs, mealLogs, wellnessCheckIns } = useHealth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7d");

  const filteredHistory = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timePeriod) {
      case "7d":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return healthHistory;
    }

    return healthHistory.filter(h => new Date(h.date) >= cutoffDate);
  }, [healthHistory, timePeriod]);

  const stepsData = useMemo(() => {
    return filteredHistory.map(h => ({
      date: h.date,
      value: h.metrics.steps,
    }));
  }, [filteredHistory]);

  const waterData = useMemo(() => {
    return filteredHistory.map(h => ({
      date: h.date,
      value: h.metrics.water || 0,
    }));
  }, [filteredHistory]);

  const sleepData = useMemo(() => {
    return filteredHistory.map(h => ({
      date: h.date,
      value: h.metrics.sleep || 0,
    }));
  }, [filteredHistory]);

  const caloriesData = useMemo(() => {
    return filteredHistory.map(h => ({
      date: h.date,
      value: h.metrics.calories || 0,
    }));
  }, [filteredHistory]);

  const totalWorkouts = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timePeriod) {
      case "7d":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return exerciseLogs.length;
    }

    return exerciseLogs.filter(log => new Date(log.date) >= cutoffDate).length;
  }, [exerciseLogs, timePeriod]);

  const totalMeals = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timePeriod) {
      case "7d":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return mealLogs.length;
    }

    return mealLogs.filter(log => new Date(log.date) >= cutoffDate).length;
  }, [mealLogs, timePeriod]);

  const averageMood = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timePeriod) {
      case "7d":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }

    const filtered = wellnessCheckIns.filter(c => new Date(c.date) >= cutoffDate);
    
    if (filtered.length === 0) return "N/A";

    const moodValues: { [key: string]: number } = {
      "excellent": 5,
      "good": 4,
      "okay": 3,
      "low": 2,
      "struggling": 1,
    };

    const sum = filtered.reduce((acc, c) => acc + moodValues[c.mood], 0);
    const avg = sum / filtered.length;

    if (avg >= 4.5) return "Excellent";
    if (avg >= 3.5) return "Good";
    if (avg >= 2.5) return "Okay";
    if (avg >= 1.5) return "Low";
    return "Struggling";
  }, [wellnessCheckIns, timePeriod]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress & Stats</Text>
        <Text style={styles.headerSubtitle}>Track your wellness journey</Text>
      </View>

      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, timePeriod === "7d" && styles.periodButtonActive]}
          onPress={() => setTimePeriod("7d")}
          testID="period-7d"
        >
          <Text style={[styles.periodText, timePeriod === "7d" && styles.periodTextActive]}>
            7 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodButton, timePeriod === "30d" && styles.periodButtonActive]}
          onPress={() => setTimePeriod("30d")}
          testID="period-30d"
        >
          <Text style={[styles.periodText, timePeriod === "30d" && styles.periodTextActive]}>
            30 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodButton, timePeriod === "all" && styles.periodButtonActive]}
          onPress={() => setTimePeriod("all")}
          testID="period-all"
        >
          <Text style={[styles.periodText, timePeriod === "all" && styles.periodTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <TrendingUp size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.summaryValue}>{totalWorkouts}</Text>
            <Text style={styles.summaryLabel}>Workouts</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Calendar size={20} color={colors.secondary} strokeWidth={2} />
            </View>
            <Text style={styles.summaryValue}>{totalMeals}</Text>
            <Text style={styles.summaryLabel}>Meals Logged</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Zap size={20} color={colors.accent} strokeWidth={2} />
            </View>
            <Text style={styles.summaryValue}>{averageMood}</Text>
            <Text style={styles.summaryLabel}>Avg Mood</Text>
          </View>
        </View>

        <ProgressChart
          data={stepsData}
          title="Steps"
          unit=" steps"
          color={colors.primary}
        />

        <ProgressChart
          data={waterData}
          title="Water Intake"
          unit="L"
          color={colors.secondary}
        />

        <ProgressChart
          data={sleepData}
          title="Sleep"
          unit="h"
          color={colors.primaryLight}
        />

        <ProgressChart
          data={caloriesData}
          title="Calories"
          unit=" cal"
          color={colors.warning}
        />

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  periodSelector: {
    flexDirection: "row" as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center" as const,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: colors.surface,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  summaryCards: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
});
