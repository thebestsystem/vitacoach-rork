import { useMemo } from "react";
import type { HealthHistory, HealthMetrics, WellnessCheckIn } from "@/types/health";

export type RecoveryTrend = "up" | "steady" | "down";
export type RecoveryStatus = "recharge" | "maintain" | "perform";

export interface RecoveryBreakdownEntry {
  label: string;
  score: number;
  weight: number;
  valueLabel: string;
  insight: string;
}

export interface RecoveryScore {
  score: number;
  status: RecoveryStatus;
  trend: RecoveryTrend;
  headline: string;
  breakdown: RecoveryBreakdownEntry[];
  recommendations: string[];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const average = (values: number[]) => {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const mapMoodToScore = (mood?: HealthMetrics["mood"]) => {
  switch (mood) {
    case "excellent":
      return 1;
    case "good":
      return 0.85;
    case "okay":
      return 0.65;
    case "low":
      return 0.45;
    case "struggling":
      return 0.25;
    default:
      return 0.6;
  }
};

const stressToScore = (stress?: number) => {
  if (typeof stress !== "number") {
    return 0.6;
  }

  // stress expected on a 0-10 scale
  const normalized = clamp(1 - stress / 10, 0, 1);
  return normalized;
};

const formatHours = (hours: number) => `${hours.toFixed(1)}h`;

interface CalculateRecoveryParams {
  current?: HealthMetrics | null;
  history: HealthHistory[];
  checkIns: WellnessCheckIn[];
  hydrationTarget?: number;
}

export const calculateRecoveryScore = ({
  current,
  history,
  checkIns,
  hydrationTarget = 2.5,
}: CalculateRecoveryParams): RecoveryScore | null => {
  if (!current) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];
  const lastSeven = history
    .filter((entry) => entry.date <= today)
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 7);

  const recentSleeps = lastSeven.map((entry) => entry.metrics.sleep ?? current.sleep ?? 0);
  const recentHeartRates = lastSeven
    .map((entry) => entry.metrics.heartRate)
    .filter((value): value is number => typeof value === "number");

  const checkInStress = checkIns
    .filter((entry) => entry.date <= today)
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 5)
    .map((entry) => entry.stressLevel);

  const averageSleep = recentSleeps.length ? average(recentSleeps) : current.sleep ?? 0;
  const averageHeartRate = recentHeartRates.length ? average(recentHeartRates) : current.heartRate ?? 0;
  const averageStress = checkInStress.length ? average(checkInStress) : current.stress ?? 5;

  const sleepHours = current.sleep ?? averageSleep;
  const sleepScore = clamp(sleepHours / 8, 0, 1);
  const hydrationRatio = clamp((current.water ?? 0) / hydrationTarget, 0, 1);
  const moodScore = mapMoodToScore(current.mood);
  const stressScore = stressToScore(current.stress ?? averageStress);

  const heartRateBaseline = averageHeartRate || current.heartRate || 60;
  const heartRateDelta = current.heartRate ? current.heartRate - heartRateBaseline : 0;
  const heartRateScore = clamp(1 - Math.abs(heartRateDelta) / 15, 0, 1);

  const currentSteps = current.steps ?? 0;
  const stepTrend = (() => {
    if (lastSeven.length < 4) {
      return "steady" as RecoveryTrend;
    }
    const recentAverage = average(lastSeven.slice(0, 3).map((entry) => entry.metrics.steps ?? currentSteps));
    const previousAverage = average(lastSeven.slice(3).map((entry) => entry.metrics.steps ?? currentSteps));
    if (recentAverage > previousAverage * 1.1) {
      return "up" as RecoveryTrend;
    }
    if (recentAverage < previousAverage * 0.9) {
      return "down" as RecoveryTrend;
    }
    return "steady" as RecoveryTrend;
  })();

  const weights = {
    sleep: 0.35,
    hydration: 0.2,
    mood: 0.15,
    stress: 0.15,
    heartRate: 0.1,
    consistency: 0.05,
  };

  const consistencyScore = stepTrend === "up" ? 0.9 : stepTrend === "steady" ? 0.7 : 0.45;

  const combinedScore =
    sleepScore * weights.sleep +
    hydrationRatio * weights.hydration +
    moodScore * weights.mood +
    stressScore * weights.stress +
    heartRateScore * weights.heartRate +
    consistencyScore * weights.consistency;

  const score = Math.round(clamp(combinedScore, 0, 1) * 100);

  let status: RecoveryStatus = "maintain";
  let headline = "Maintain steady progress";
  if (score < 50) {
    status = "recharge";
    headline = "Give your body extra care today";
  } else if (score >= 75) {
    status = "perform";
    headline = "You’re ready to thrive";
  }

  const breakdown: RecoveryBreakdownEntry[] = [
    {
      label: "Restoration",
      score: Math.round(sleepScore * 100),
      weight: weights.sleep,
      valueLabel: formatHours(sleepHours),
      insight:
        sleepHours >= 7.5
          ? "Great consistency in your sleep routine"
          : "Aim for a calming routine to reach 7-8h",
    },
    {
      label: "Hydration",
      score: Math.round(hydrationRatio * 100),
      weight: weights.hydration,
      valueLabel: `${(current.water ?? 0).toFixed(1)}L`,
      insight:
        hydrationRatio >= 0.85
          ? "Hydration habits are supporting recovery"
          : "Keep your bottle nearby to stay on track",
    },
    {
      label: "Mood",
      score: Math.round(moodScore * 100),
      weight: weights.mood,
      valueLabel: (current.mood ?? "okay").replace("_", " "),
      insight:
        moodScore >= 0.75
          ? "Positive energy is fueling performance"
          : "Take a mindful pause to reset",
    },
    {
      label: "Stress",
      score: Math.round(stressScore * 100),
      weight: weights.stress,
      valueLabel: `${Math.round(current.stress ?? averageStress)}/10`,
      insight:
        stressScore >= 0.75
          ? "You’re managing stress effectively"
          : "Build micro-breaks into your day",
    },
    {
      label: "Heart",
      score: Math.round(heartRateScore * 100),
      weight: weights.heartRate,
      valueLabel: current.heartRate ? `${current.heartRate} bpm` : `${Math.round(heartRateBaseline)} bpm`,
      insight:
        heartRateScore >= 0.75
          ? "Heart rate trends are stable"
          : "Consider a light mobility session",
    },
  ];

  const recommendations: string[] = [];

  if (status === "recharge") {
    recommendations.push("Prioritize gentle movement and restorative practices");
  }
  if (sleepHours < 7) {
    recommendations.push("Wind down 45 minutes earlier for deeper sleep");
  }
  if (hydrationRatio < 0.75) {
    recommendations.push("Add two focused hydration breaks before mid-afternoon");
  }
  if (stressScore < 0.65) {
    recommendations.push("Schedule a 5-minute breathing reset between tasks");
  }
  if (moodScore < 0.6) {
    recommendations.push("Celebrate a small win to boost motivation");
  }
  if (stepTrend === "down") {
    recommendations.push("Plan a short walk to rebuild consistency");
  }

  return {
    score,
    status,
    trend: stepTrend,
    headline,
    breakdown,
    recommendations,
  };
};

export const useRecoveryScore = ({
  current,
  history,
  checkIns,
  hydrationTarget,
}: CalculateRecoveryParams) =>
  useMemo(
    () =>
      calculateRecoveryScore({
        current,
        history,
        checkIns,
        hydrationTarget,
      }),
    [current, history, checkIns, hydrationTarget]
  );

