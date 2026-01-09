import { useMemo } from "react";
import { useHealth } from "@/contexts/HealthContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

export interface KPIData {
  value: number | string;
  label: string;
  trend?: number;
  trendLabel?: string;
  color: string;
  icon: string;
}

export interface DashboardKPIs {
  health: {
    todaySteps: KPIData;
    weeklyAvgSteps: KPIData;
    todayCalories: KPIData;
    todayWater: KPIData;
    sleepQuality: KPIData;
    currentMood: KPIData;
  };
  activity: {
    totalWorkouts: KPIData;
    weeklyWorkouts: KPIData;
    totalMeals: KPIData;
    weeklyCheckIns: KPIData;
  };
  gamification: {
    totalPoints: KPIData;
    currentStreak: KPIData;
    achievementsUnlocked: KPIData;
    completionRate: KPIData;
  };
  subscription: {
    planName: KPIData;
    quotaUsage: KPIData;
    storageUsage: KPIData;
    trialStatus: KPIData;
  };
  summary: {
    overallHealth: number;
    activityLevel: number;
    engagement: number;
  };
}

export function useDashboardKPIs(): DashboardKPIs {
  const { 
    healthMetrics, 
    healthHistory, 
    exerciseLogs, 
    mealLogs, 
    wellnessCheckIns 
  } = useHealth();
  
  const { 
    achievements, 
    streaks, 
    totalPoints,
    unlockedAchievements 
  } = useGamification();
  
  const { 
    currentPlan, 
    planFeatures, 
    quotaUsage, 
    quotaLimits,
    isTrialActive,
    trialDaysRemaining 
  } = useSubscription();

  const oneWeekAgo = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }, []);

  const weeklyHistory = useMemo(() => {
    return healthHistory.filter(h => new Date(h.date) >= oneWeekAgo);
  }, [healthHistory, oneWeekAgo]);

  const weeklyAvgSteps = useMemo(() => {
    if (weeklyHistory.length === 0) return 0;
    const total = weeklyHistory.reduce((acc, h) => acc + h.metrics.steps, 0);
    return Math.round(total / weeklyHistory.length);
  }, [weeklyHistory]);

  const stepsTrend = useMemo(() => {
    if (weeklyHistory.length < 2) return 0;
    const midPoint = Math.floor(weeklyHistory.length / 2);
    const firstHalf = weeklyHistory.slice(0, midPoint);
    const secondHalf = weeklyHistory.slice(midPoint);
    
    const firstAvg = firstHalf.reduce((acc, h) => acc + h.metrics.steps, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, h) => acc + h.metrics.steps, 0) / secondHalf.length;
    
    return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
  }, [weeklyHistory]);

  const weeklyWorkouts = useMemo(() => {
    return exerciseLogs.filter(log => new Date(log.date) >= oneWeekAgo).length;
  }, [exerciseLogs, oneWeekAgo]);

  const weeklyCheckIns = useMemo(() => {
    return wellnessCheckIns.filter(c => new Date(c.date) >= oneWeekAgo).length;
  }, [wellnessCheckIns, oneWeekAgo]);

  const currentStreak = useMemo(() => {
    const workoutStreak = streaks.find(s => s.type === "workout");
    return workoutStreak?.current || 0;
  }, [streaks]);

  const longestStreak = useMemo(() => {
    return Math.max(...streaks.map(s => s.longest), 0);
  }, [streaks]);

  const achievementCompletionRate = useMemo(() => {
    if (achievements.length === 0) return 0;
    return Math.round((unlockedAchievements.length / achievements.length) * 100);
  }, [achievements, unlockedAchievements]);

  const quotaUsagePercent = useMemo(() => {
    if (!quotaUsage || !quotaLimits) return 0;
    
    const workoutUsage = quotaLimits.workoutPlansPerMonth === -1 
      ? 0 
      : (quotaUsage.workoutPlansThisMonth / quotaLimits.workoutPlansPerMonth) * 100;
    
    const mealUsage = quotaLimits.mealPlansPerMonth === -1 
      ? 0 
      : (quotaUsage.mealPlansThisMonth / quotaLimits.mealPlansPerMonth) * 100;
    
    const messageUsage = quotaLimits.aiCoachMessagesPerDay === -1 
      ? 0 
      : (quotaUsage.aiCoachMessagesToday / quotaLimits.aiCoachMessagesPerDay) * 100;
    
    return Math.round((workoutUsage + mealUsage + messageUsage) / 3);
  }, [quotaUsage, quotaLimits]);

  const storageUsagePercent = useMemo(() => {
    if (!quotaUsage || !quotaLimits) return 0;
    if (quotaLimits.storageLimit === -1) return 0;
    return Math.round((quotaUsage.storageUsed / quotaLimits.storageLimit) * 100);
  }, [quotaUsage, quotaLimits]);

  const moodEmoji = useMemo(() => {
    switch (healthMetrics?.mood) {
      case "excellent":
        return "😄";
      case "good":
        return "😊";
      case "okay":
        return "😐";
      case "low":
        return "😔";
      case "struggling":
        return "😢";
      default:
        return "😊";
    }
  }, [healthMetrics?.mood]);

  const sleepQualityText = useMemo(() => {
    const sleep = healthMetrics?.sleep || 0;
    if (sleep >= 8) return "Excellent";
    if (sleep >= 7) return "Good";
    if (sleep >= 6) return "Fair";
    return "Poor";
  }, [healthMetrics?.sleep]);

  const overallHealth = useMemo(() => {
    let score = 0;
    let factors = 0;

    if (healthMetrics?.steps) {
      score += Math.min((healthMetrics.steps / 10000) * 25, 25);
      factors++;
    }

    if (healthMetrics?.water) {
      score += Math.min((healthMetrics.water / 2.5) * 25, 25);
      factors++;
    }

    if (healthMetrics?.sleep) {
      score += Math.min((healthMetrics.sleep / 8) * 25, 25);
      factors++;
    }

    if (healthMetrics?.mood) {
      const moodScore = {
        excellent: 25,
        good: 20,
        okay: 15,
        low: 10,
        struggling: 5,
      }[healthMetrics.mood] || 15;
      score += moodScore;
      factors++;
    }

    return factors > 0 ? Math.round(score) : 0;
  }, [healthMetrics]);

  const activityLevel = useMemo(() => {
    let score = 0;

    if (weeklyWorkouts >= 5) score += 40;
    else if (weeklyWorkouts >= 3) score += 30;
    else if (weeklyWorkouts >= 1) score += 20;

    if (mealLogs.length >= 21) score += 30;
    else if (mealLogs.length >= 14) score += 20;
    else if (mealLogs.length >= 7) score += 10;

    if (weeklyCheckIns >= 7) score += 30;
    else if (weeklyCheckIns >= 4) score += 20;
    else if (weeklyCheckIns >= 1) score += 10;

    return Math.min(score, 100);
  }, [weeklyWorkouts, mealLogs, weeklyCheckIns]);

  const engagement = useMemo(() => {
    let score = 0;

    if (currentStreak >= 7) score += 40;
    else if (currentStreak >= 3) score += 25;
    else if (currentStreak >= 1) score += 15;

    score += Math.min(unlockedAchievements.length * 5, 30);

    if (totalPoints >= 500) score += 30;
    else if (totalPoints >= 200) score += 20;
    else if (totalPoints >= 50) score += 10;

    return Math.min(score, 100);
  }, [currentStreak, unlockedAchievements, totalPoints]);

  return useMemo(() => ({
    health: {
      todaySteps: {
        value: healthMetrics?.steps?.toLocaleString() || "0",
        label: "Steps Today",
        trend: stepsTrend,
        trendLabel: stepsTrend > 0 ? `+${stepsTrend}%` : `${stepsTrend}%`,
        color: "#6366F1",
        icon: "👣",
      },
      weeklyAvgSteps: {
        value: weeklyAvgSteps.toLocaleString(),
        label: "Avg Steps/Day",
        color: "#8B5CF6",
        icon: "📊",
      },
      todayCalories: {
        value: healthMetrics?.calories?.toLocaleString() || "0",
        label: "Calories Today",
        color: "#F59E0B",
        icon: "🔥",
      },
      todayWater: {
        value: `${healthMetrics?.water || 0}L`,
        label: "Water Today",
        color: "#3B82F6",
        icon: "💧",
      },
      sleepQuality: {
        value: `${healthMetrics?.sleep || 0}h`,
        label: sleepQualityText,
        color: "#8B5CF6",
        icon: "🌙",
      },
      currentMood: {
        value: moodEmoji,
        label: healthMetrics?.mood || "Unknown",
        color: "#EC4899",
        icon: "💭",
      },
    },
    activity: {
      totalWorkouts: {
        value: exerciseLogs.length,
        label: "Total Workouts",
        color: "#10B981",
        icon: "💪",
      },
      weeklyWorkouts: {
        value: weeklyWorkouts,
        label: "This Week",
        color: "#059669",
        icon: "📅",
      },
      totalMeals: {
        value: mealLogs.length,
        label: "Meals Logged",
        color: "#F97316",
        icon: "🍎",
      },
      weeklyCheckIns: {
        value: weeklyCheckIns,
        label: "Check-ins (7d)",
        color: "#8B5CF6",
        icon: "🧘",
      },
    },
    gamification: {
      totalPoints: {
        value: totalPoints.toLocaleString(),
        label: "Total Points",
        color: "#FBBF24",
        icon: "⭐",
      },
      currentStreak: {
        value: currentStreak,
        label: `Current / ${longestStreak} Best`,
        color: "#EF4444",
        icon: "🔥",
      },
      achievementsUnlocked: {
        value: `${unlockedAchievements.length}/${achievements.length}`,
        label: "Achievements",
        color: "#A855F7",
        icon: "🏆",
      },
      completionRate: {
        value: `${achievementCompletionRate}%`,
        label: "Completion",
        color: "#14B8A6",
        icon: "📈",
      },
    },
    subscription: {
      planName: {
        value: planFeatures?.name || "Free",
        label: currentPlan.toUpperCase(),
        color: "#6366F1",
        icon: "💎",
      },
      quotaUsage: {
        value: `${quotaUsagePercent}%`,
        label: "Quota Used",
        color: quotaUsagePercent > 80 ? "#EF4444" : "#10B981",
        icon: "📊",
      },
      storageUsage: {
        value: `${storageUsagePercent}%`,
        label: "Storage Used",
        color: storageUsagePercent > 80 ? "#EF4444" : "#10B981",
        icon: "💾",
      },
      trialStatus: {
        value: isTrialActive ? `${trialDaysRemaining}d` : "N/A",
        label: isTrialActive ? "Trial Left" : "Not in Trial",
        color: isTrialActive ? "#F59E0B" : "#6B7280",
        icon: "⏰",
      },
    },
    summary: {
      overallHealth,
      activityLevel,
      engagement,
    },
  }), [
    healthMetrics,
    weeklyAvgSteps,
    stepsTrend,
    moodEmoji,
    sleepQualityText,
    exerciseLogs.length,
    weeklyWorkouts,
    mealLogs.length,
    weeklyCheckIns,
    totalPoints,
    currentStreak,
    longestStreak,
    unlockedAchievements.length,
    achievements.length,
    achievementCompletionRate,
    planFeatures,
    currentPlan,
    quotaUsagePercent,
    storageUsagePercent,
    isTrialActive,
    trialDaysRemaining,
    overallHealth,
    activityLevel,
    engagement,
  ]);
}
