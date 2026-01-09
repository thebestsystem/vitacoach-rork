import type { HealthHistory, HealthMetrics, WellnessCheckIn } from "@/types/health";

export type ResilienceTrend = "climbing" | "steady" | "cooling";
export type ResilienceStatus = "thriving" | "stable" | "vulnerable";

export type ResilienceDriverKey = "sleep" | "stress" | "mood" | "energy" | "consistency";

export interface ResilienceDriver {
  key: ResilienceDriverKey;
  label: string;
  score: number;
  change: number;
  narrative: string;
  importance: "high" | "medium" | "supporting";
}

export interface ResilienceProfile {
  score: number;
  status: ResilienceStatus;
  trend: ResilienceTrend;
  summary: string;
  drivers: ResilienceDriver[];
  recommendations: string[];
}

interface ComputeResilienceProfileOptions {
  current?: HealthMetrics | null;
  history: HealthHistory[];
  checkIns: WellnessCheckIn[];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const average = (values: number[]) => {
  if (!values.length) {
    return 0;
  }
  return values.reduce((acc, value) => acc + value, 0) / values.length;
};

const mapMoodToScore = (mood?: HealthMetrics["mood"] | WellnessCheckIn["mood"]) => {
  switch (mood) {
    case "excellent":
      return 1;
    case "good":
      return 0.82;
    case "okay":
      return 0.65;
    case "low":
      return 0.45;
    case "struggling":
      return 0.28;
    default:
      return 0.6;
  }
};

const computeCheckInResilience = (checkIn: WellnessCheckIn) => {
  const moodScore = mapMoodToScore(checkIn.mood);
  const stressScore = clamp(1 - checkIn.stressLevel / 10, 0, 1);
  const energyScore = clamp((checkIn.energyLevel ?? 5) / 10, 0, 1);
  const sleepScore = clamp((checkIn.sleepQuality ?? 5) / 10, 0, 1);

  return clamp(moodScore * 0.32 + stressScore * 0.28 + energyScore * 0.2 + sleepScore * 0.2, 0, 1);
};

const computeDriverChange = (values: number[]) => {
  if (values.length < 4) {
    return 0;
  }

  const midpoint = Math.floor(values.length / 2);
  const recent = values.slice(-midpoint);
  const previous = values.slice(0, -midpoint);
  return average(recent) - average(previous);
};

export const computeResilienceProfile = ({
  current,
  history,
  checkIns,
}: ComputeResilienceProfileOptions): ResilienceProfile | null => {
  if (!current) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];

  const orderedHistory = history
    .filter((entry) => entry.date <= today)
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  const lastSevenHistory = orderedHistory.slice(0, 7);
  const previousSevenHistory = orderedHistory.slice(7, 14);

  const recentCheckIns = [...checkIns]
    .filter((entry) => entry.date <= today)
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 8);

  const previousCheckIns = [...checkIns]
    .filter((entry) => entry.date < (recentCheckIns[recentCheckIns.length - 1]?.date ?? today))
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 6);

  const sleepHoursRecent = lastSevenHistory.map((entry) => entry.metrics.sleep ?? current.sleep ?? 0);
  const sleepHoursPrevious = previousSevenHistory.map((entry) => entry.metrics.sleep ?? current.sleep ?? 0);

  const stepsRecent = lastSevenHistory.map((entry) => entry.metrics.steps ?? current.steps ?? 0);
  const stepsPrevious = previousSevenHistory.map((entry) => entry.metrics.steps ?? current.steps ?? 0);

  const sleepAverage = sleepHoursRecent.length ? average(sleepHoursRecent) : current.sleep ?? 0;
  const sleepScore = clamp(sleepAverage / 8, 0, 1);

  const checkInStressRecent = recentCheckIns.map((entry) => entry.stressLevel ?? 5);
  const stressAverage = checkInStressRecent.length ? average(checkInStressRecent) : current.stress ?? 5;
  const stressScore = clamp(1 - (stressAverage ?? 5) / 10, 0, 1);

  const moodAverage = recentCheckIns.length
    ? average(recentCheckIns.map((entry) => mapMoodToScore(entry.mood)))
    : mapMoodToScore(current.mood);

  const energyAverage = recentCheckIns.length
    ? average(recentCheckIns.map((entry) => clamp((entry.energyLevel ?? 5) / 10, 0, 1)))
    : clamp((current.calories ?? 0) > 0 ? 0.65 : 0.55, 0, 1);

  const sleepQualityAverage = recentCheckIns.length
    ? average(recentCheckIns.map((entry) => clamp((entry.sleepQuality ?? 5) / 10, 0, 1)))
    : clamp((current.sleep ?? 0) / 8, 0, 1);

  const consistencyScore = (() => {
    if (stepsRecent.length < 3 || stepsPrevious.length < 3) {
      return clamp((current.steps ?? 0) / 8000, 0, 1) * 0.9;
    }
    const recentAverage = average(stepsRecent);
    const previousAverage = average(stepsPrevious);
    if (!previousAverage) {
      return clamp(recentAverage / 8000, 0, 1);
    }
    const changeRatio = clamp(recentAverage / previousAverage, 0.4, 1.6);
    return clamp((recentAverage / 9000) * 0.6 + changeRatio * 0.4, 0, 1);
  })();

  const overallScore = clamp(
    sleepScore * 0.26 +
      stressScore * 0.22 +
      moodAverage * 0.2 +
      sleepQualityAverage * 0.16 +
      consistencyScore * 0.1 +
      energyAverage * 0.06,
    0,
    1,
  );

  let status: ResilienceStatus = "stable";
  if (overallScore >= 0.76) {
    status = "thriving";
  } else if (overallScore < 0.55) {
    status = "vulnerable";
  }

  const checkInScores = recentCheckIns.map(computeCheckInResilience);
  const previousScores = previousCheckIns.map(computeCheckInResilience);
  const change = checkInScores.length >= 2 ? average(checkInScores.slice(0, Math.max(1, checkInScores.length / 2))) : 0;
  const baseline = previousScores.length >= 2 ? average(previousScores) : change;
  const delta = change - baseline;

  let trend: ResilienceTrend = "steady";
  if (delta > 0.04) {
    trend = "climbing";
  } else if (delta < -0.04) {
    trend = "cooling";
  }

  const drivers: ResilienceDriver[] = [
    {
      key: "sleep",
      label: "Sleep Depth",
      score: Math.round(sleepScore * 100),
      change: Math.round(computeDriverChange([...sleepHoursPrevious, ...sleepHoursRecent]) * 10) / 10,
      narrative:
        sleepScore >= 0.85
          ? "Consistent 7-8 hour nights are reinforcing recovery"
          : "Aim for a calming wind-down to reach 7h of sleep",
      importance: "high",
    },
    {
      key: "stress",
      label: "Stress Buffer",
      score: Math.round(stressScore * 100),
      change: Math.round(computeDriverChange(checkInStressRecent.map((value) => 10 - value)) * 10) / 10,
      narrative:
        stressScore >= 0.75
          ? "Stress signals are well managed—keep protecting buffers"
          : "Insert micro-breaks and breath work to lower strain",
      importance: "high",
    },
    {
      key: "mood",
      label: "Emotional Tone",
      score: Math.round(moodAverage * 100),
      change:
        recentCheckIns.length >= 4
          ? Math.round(
              computeDriverChange(recentCheckIns.map((entry) => mapMoodToScore(entry.mood) * 100))
            ) / 100
          : 0,
      narrative:
        moodAverage >= 0.75
          ? "Optimistic energy is fueling resilience"
          : "Lighten cognitive load and create quick wins",
      importance: "medium",
    },
    {
      key: "energy",
      label: "Energy Availability",
      score: Math.round(energyAverage * 100),
      change:
        recentCheckIns.length >= 4
          ? Math.round(
              computeDriverChange(recentCheckIns.map((entry) => clamp((entry.energyLevel ?? 5) / 10, 0, 1) * 100))
            ) / 100
          : 0,
      narrative:
        energyAverage >= 0.7
          ? "Daily energy is holding strong"
          : "Stabilize meals & movement snacks to lift energy",
      importance: "supporting",
    },
    {
      key: "consistency",
      label: "Routine Consistency",
      score: Math.round(consistencyScore * 100),
      change:
        Math.round(
          computeDriverChange([...stepsPrevious, ...stepsRecent].map((value) => (value ? value / 1000 : 0))) * 10,
        ) / 10,
      narrative:
        consistencyScore >= 0.7
          ? "Movement rhythm is steady—great foundation"
          : "Rebuild anchors with 10-minute movement breaks",
      importance: "supporting",
    },
  ];

  const recommendations: string[] = [];

  const lowSleep = drivers.find((driver) => driver.key === "sleep" && driver.score < 70);
  if (lowSleep) {
    recommendations.push("Protect a 45-minute wind-down—no screens & calming breath work");
  }

  const elevatedStress = drivers.find((driver) => driver.key === "stress" && driver.score < 70);
  if (elevatedStress) {
    recommendations.push("Schedule two 5-minute decompression breaks with guided breathing");
  }

  const lowMood = drivers.find((driver) => driver.key === "mood" && driver.score < 65);
  if (lowMood) {
    recommendations.push("Stack a quick win: celebrate progress & message your accountability partner");
  }

  const lowConsistency = drivers.find((driver) => driver.key === "consistency" && driver.score < 65);
  if (lowConsistency) {
    recommendations.push("Anchor movement after meals—add a 10-minute walk or stretch session");
  }

  if (!recommendations.length) {
    recommendations.push("Keep reinforcing your hydration, recovery, and check-in rituals—your system is adapting well");
  }

  const summary = (() => {
    if (status === "thriving" && trend === "climbing") {
      return "Your routines are stacking momentum—expand capacity with purposeful pushes.";
    }
    if (status === "thriving") {
      return "Resilience is strong. Keep micro-habits consistent to lock in gains.";
    }
    if (status === "vulnerable") {
      return "Your system needs extra buffering—stabilize sleep, lower stress spikes, and move gently.";
    }
    if (trend === "cooling") {
      return "Resilience is dipping. Recommit to recovery anchors and mindful breaks.";
    }
    return "You’re holding steady. Tighten routines to unlock the next level.";
  })();

  return {
    score: Math.round(overallScore * 100),
    status,
    trend,
    summary,
    drivers,
    recommendations,
  };
};
