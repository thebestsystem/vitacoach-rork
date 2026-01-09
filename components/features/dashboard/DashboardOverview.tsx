import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import colors from "@/constants/colors";
import { useDashboardKPIs } from "@/hooks/useDashboardKPIs";
import { useHealth } from "@/contexts/HealthContext";
import DashboardKPICard from "./DashboardKPICard";
import { RecalibrationAlertCard } from "./RecalibrationAlertCard";
import PremiumInsightsCard from "../premium/PremiumInsights";
import { WellnessTrendsChart } from "./WellnessTrendsChart";
import { InlineError } from "@/components/ui/InlineError";

type DashboardView = "health" | "activity" | "gamification" | "subscription";

interface CircularProgressProps {
  value: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
}

function CircularProgress({ value, size, strokeWidth, color, label }: CircularProgressProps) {
  return (
    <View style={styles.circularProgress}>
      <View style={{ width: size, height: size, position: "relative" as const }}>
        <View 
          style={[
            styles.circularProgressBackground,
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: colors.borderLight,
            }
          ]} 
        />
        <View 
          style={[
            styles.circularProgressForeground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              transform: [{ rotate: "-90deg" }],
            },
          ]}
        >
          <View style={{ 
            width: size - strokeWidth * 2, 
            height: size - strokeWidth * 2,
            borderRadius: (size - strokeWidth * 2) / 2,
            backgroundColor: colors.surface,
            position: "absolute" as const,
            top: strokeWidth,
            left: strokeWidth,
          }} />
        </View>
        <View style={styles.circularProgressText}>
          <Text style={styles.circularProgressValue}>{value}%</Text>
        </View>
      </View>
      <Text style={styles.circularProgressLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardOverview() {
  const kpis = useDashboardKPIs();
  const health = useHealth();
  const [activeView, setActiveView] = useState<DashboardView>("health");

  const trendsData = useMemo(() => {
    // Use healthHistory for trends to ensure we capture the daily aggregate state
    if (!health.healthHistory || health.healthHistory.length === 0) {
       return [];
    }

    // Get last 7 days of history
    const last7 = health.healthHistory
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return last7.map(entry => {
        const date = new Date(entry.date);
        const { mood, stress, energy } = entry.metrics;

        return {
            label: days[date.getDay()],
            mood: mood === 'excellent' ? 10 : mood === 'good' ? 8 : mood === 'okay' ? 5 : 3,
            stress: stress ?? 0,
            energy: energy ?? 5 // Default to 5 if energy missing
        };
    });
  }, [health.healthHistory]);

  const shouldShowRecalibration = useMemo(() => {
    if (!health.healthHistory || health.healthHistory.length < 7) return false;
    if (!health.wellnessCheckIns || health.wellnessCheckIns.length < 3) return false;
    if (!health.healthMetrics) return false;

    const recentHistory = health.healthHistory.slice(-7);
    const sleepData = recentHistory
      .map((h) => h.metrics.sleep)
      .filter((s): s is number => typeof s === "number");
    const avgSleep = sleepData.length > 0
      ? sleepData.reduce((sum, s) => sum + s, 0) / sleepData.length
      : 7;

    const recentCheckIns = health.wellnessCheckIns.slice(-7);
    const avgStress = recentCheckIns.length > 0
      ? recentCheckIns.reduce((sum, ci) => sum + ci.stressLevel, 0) / recentCheckIns.length
      : 5;

    const avgEnergy = recentCheckIns.length > 0
      ? recentCheckIns.reduce((sum, ci) => sum + ci.energyLevel, 0) / recentCheckIns.length
      : 5;

    const lowSleep = avgSleep < 6.5;
    const highStress = avgStress > 7;
    const lowEnergy = avgEnergy < 4;

    const hasPlans = health.workoutPlans.length > 0 || health.mealPlans.length > 0;

    return hasPlans && (lowSleep || highStress || lowEnergy);
  }, [health]);


  const tabs: { id: DashboardView; label: string; icon: string }[] = useMemo(() => [
    { id: "health", label: "Health", icon: "❤️" },
    { id: "activity", label: "Activity", icon: "💪" },
    { id: "gamification", label: "Progress", icon: "🏆" },
    { id: "subscription", label: "Plan", icon: "💎" },
  ], []);

  const renderHealthView = () => (
    <View style={styles.gridContainer}>
      {shouldShowRecalibration && <RecalibrationAlertCard />}

      <View style={{ width: '100%' }}>
         <PremiumInsightsCard />
      </View>

      {trendsData.length > 0 && (
          <View style={{ width: '100%' }}>
              <WellnessTrendsChart data={trendsData} />
          </View>
      )}

      <DashboardKPICard 
        kpi={kpis.health.todaySteps} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-steps"
      />
      <DashboardKPICard 
        kpi={kpis.health.weeklyAvgSteps} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-avg-steps"
      />
      <DashboardKPICard 
        kpi={kpis.health.todayCalories} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-calories"
      />
      <DashboardKPICard 
        kpi={kpis.health.todayWater} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-water"
      />
      <DashboardKPICard 
        kpi={kpis.health.sleepQuality} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-sleep"
      />
      <DashboardKPICard 
        kpi={kpis.health.currentMood} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-mood"
      />
    </View>
  );

  const renderActivityView = () => (
    <View style={styles.gridContainer}>
      <DashboardKPICard 
        kpi={kpis.activity.totalWorkouts} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-total-workouts"
      />
      <DashboardKPICard 
        kpi={kpis.activity.weeklyWorkouts} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-weekly-workouts"
      />
      <DashboardKPICard 
        kpi={kpis.activity.totalMeals} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-total-meals"
      />
      <DashboardKPICard 
        kpi={kpis.activity.weeklyCheckIns} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-checkins"
      />
    </View>
  );

  const renderGamificationView = () => (
    <View style={styles.gridContainer}>
      <DashboardKPICard 
        kpi={kpis.gamification.totalPoints} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-points"
      />
      <DashboardKPICard 
        kpi={kpis.gamification.currentStreak} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-streak"
      />
      <DashboardKPICard 
        kpi={kpis.gamification.achievementsUnlocked} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-achievements"
      />
      <DashboardKPICard 
        kpi={kpis.gamification.completionRate} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-completion"
      />
    </View>
  );

  const renderSubscriptionView = () => (
    <View style={styles.gridContainer}>
      <DashboardKPICard 
        kpi={kpis.subscription.planName} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-plan"
      />
      <DashboardKPICard 
        kpi={kpis.subscription.quotaUsage} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-quota"
      />
      <DashboardKPICard 
        kpi={kpis.subscription.storageUsage} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-storage"
      />
      <DashboardKPICard 
        kpi={kpis.subscription.trialStatus} 
        size="medium"
        style={styles.gridItem}
        testID="kpi-trial"
      />
    </View>
  );

  return (
    <View style={styles.container}>
       <InlineError
          error={health.syncError}
          onRetry={health.refreshAll}
          onDismiss={health.clearSyncError}
       />

      <LinearGradient 
        colors={[colors.gradient1[0], colors.gradient1[1]] as readonly [string, string, ...string[]]} 
        style={styles.summaryCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.summaryTitle}>Overall Wellness Score</Text>
        <View style={styles.summaryScores}>
          <CircularProgress
            value={kpis.summary.overallHealth}
            size={80}
            strokeWidth={6}
            color={colors.success}
            label="Health"
          />
          <CircularProgress
            value={kpis.summary.activityLevel}
            size={80}
            strokeWidth={6}
            color={colors.warning}
            label="Activity"
          />
          <CircularProgress
            value={kpis.summary.engagement}
            size={80}
            strokeWidth={6}
            color={colors.accent}
            label="Engagement"
          />
        </View>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeView === tab.id && styles.tabActive,
            ]}
            onPress={() => setActiveView(tab.id)}
            testID={`tab-${tab.id}`}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                activeView === tab.id && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {activeView === "health" && renderHealthView()}
        {activeView === "activity" && renderActivityView()}
        {activeView === "gamification" && renderGamificationView()}
        {activeView === "subscription" && renderSubscriptionView()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.surface,
    marginBottom: 20,
    textAlign: "center" as const,
  },
  summaryScores: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    alignItems: "center" as const,
  },
  circularProgress: {
    alignItems: "center" as const,
    gap: 8,
  },
  circularProgressBackground: {
    position: "absolute" as const,
    top: 0,
    left: 0,
  },
  circularProgressForeground: {
    position: "absolute" as const,
    top: 0,
    left: 0,
  },
  circularProgressText: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  circularProgressValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.text,
  },
  circularProgressLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.surface,
    textAlign: "center" as const,
  },
  tabsContainer: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.surface,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  gridContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  gridItem: {
    width: "48%" as const,
    flexGrow: 0,
    flexShrink: 0,
  },
});
