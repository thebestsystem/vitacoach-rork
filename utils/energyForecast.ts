import type {
  EnergyForecastDay,
  EnergyFocus,
  EnergyForecastDriver,
  EnergyImpact,
  HealthHistory,
  HealthMetrics,
  WellnessCheckIn,
} from "@/types/health";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getRecentEntries = (history: HealthHistory[], days: number) => {
  if (!history.length) {
    return [];
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffIso = cutoff.toISOString().split("T")[0];

  return history.filter((entry) => entry.date >= cutoffIso);
};

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  const filtered = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
  if (!filtered.length) {
    return 0;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
};

const moodToScore: Record<string, number> = {
  excellent: 92,
  good: 78,
  okay: 62,
  low: 45,
  struggling: 30,
};

const focusHeadlines: Record<EnergyFocus, string> = {
  recovery: "Protect your recharge window",
  balance: "Keep your rhythm balanced",
  push: "Momentum to lean in",
};

const baseActions: Record<EnergyFocus, string[]> = {
  recovery: [
    "Plan a decompression block this evening",
    "Prioritize hydration and intentional breathwork",
    "Ease intensity — opt for mobility or mindful movement",
  ],
  balance: [
    "Stack deep work in your mid-day energy peak",
    "Anchor the day with a 5-minute mood check-in",
    "Keep hydration cadence steady (250ml every 2 hours)",
  ],
  push: [
    "Schedule your most demanding work in the first half of the day",
    "Layer in a performance-level workout or interval session",
    "Refuel with protein within 45 minutes of training",
  ],
};

interface EnergyForecastOptions {
  history: HealthHistory[];
  checkIns: WellnessCheckIn[];
  current?: HealthMetrics | null;
  days?: number;
}

const computeMomentum = (history: HealthHistory[], key: keyof HealthMetrics) => {
  if (history.length < 4) {
    return 0;
  }

  const sorted = [...history].sort((a, b) => (a.date > b.date ? 1 : -1));
  const recent = sorted.slice(-4);
  const earlier = sorted.slice(-8, -4);

  const recentAvg = average(recent.map((entry) => (entry.metrics[key] as number) ?? 0));
  const earlierAvg = average(earlier.map((entry) => (entry.metrics[key] as number) ?? 0));

  if (earlierAvg === 0) {
    return 0;
  }

  return clamp(((recentAvg - earlierAvg) / earlierAvg) * 100, -40, 40);
};

const computeStressAverage = (checkIns: WellnessCheckIn[], days: number) => {
  if (!checkIns.length) {
    return 50;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffIso = cutoff.toISOString().split("T")[0];

  const recent = checkIns.filter((entry) => entry.date >= cutoffIso);
  if (!recent.length) {
    return 50;
  }

  return average(recent.map((entry) => clamp(entry.stressLevel * 10, 10, 100)));
};

const computeMoodAverage = (checkIns: WellnessCheckIn[], days: number) => {
  if (!checkIns.length) {
    return 65;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffIso = cutoff.toISOString().split("T")[0];

  const recent = checkIns.filter((entry) => entry.date >= cutoffIso);
  if (!recent.length) {
    return 65;
  }

  return average(
    recent.map((entry) => (entry.mood ? moodToScore[entry.mood] ?? 65 : 65))
  );
};

export const generateEnergyForecast = ({
  history,
  checkIns,
  current,
  days = 3,
}: EnergyForecastOptions): EnergyForecastDay[] => {
  if (!history.length && !current) {
    return [];
  }

  const recentHistory = getRecentEntries(history, 7);

  const stepsAvg = average(
    recentHistory.length ? recentHistory.map((entry) => entry.metrics.steps ?? 0) : [current?.steps ?? 0]
  );
  const sleepAvg = average(
    recentHistory.length
      ? recentHistory.map((entry) => entry.metrics.sleep ?? current?.sleep ?? 0)
      : [current?.sleep ?? 0]
  );
  const waterAvg = average(
    recentHistory.length
      ? recentHistory.map((entry) => entry.metrics.water ?? current?.water ?? 0)
      : [current?.water ?? 0]
  );

  const stressAvg = computeStressAverage(checkIns, 7);
  const moodAvg = computeMoodAverage(checkIns, 7);

  const stepsMomentum = computeMomentum(recentHistory, "steps");
  const sleepMomentum = computeMomentum(recentHistory, "sleep");

  const hydrationScore = clamp((waterAvg / 2.6) * 100, 0, 100);
  const movementScore = clamp((stepsAvg / 9000) * 100, 0, 100);
  const sleepScore = clamp((sleepAvg / 7.5) * 100, 0, 100);

  const energyBaseline = clamp(
    sleepScore * 0.35 + movementScore * 0.3 + hydrationScore * 0.1 + moodAvg * 0.25,
    20,
    95
  );

  const stressBaseline = clamp(stressAvg * 0.7 + (100 - moodAvg) * 0.3, 15, 95);

  const forecasts: EnergyForecastDay[] = [];

  for (let index = 0; index < days; index += 1) {
    const momentumModifier = index === 0 ? 1 : 1 - index * 0.2;
    const energyShift = (sleepMomentum * 0.4 + stepsMomentum * 0.35) * 0.4 * momentumModifier;
    const stressShift = ((-sleepMomentum * 0.25) + (stressAvg - 55) * 0.1) * momentumModifier;

    const energyScore = clamp(energyBaseline + energyShift, 20, 98);
    const stressScore = clamp(stressBaseline + stressShift, 10, 95);

    let focus: EnergyFocus = "balance";
    if (energyScore >= 72 && stressScore <= 45) {
      focus = "push";
    } else if (energyScore <= 58 || stressScore >= 65) {
      focus = "recovery";
    }

    const anchors: string[] = [];
    if (sleepScore >= 85) {
      anchors.push("Rested nervous system");
    }
    if (movementScore >= 80) {
      anchors.push("Movement momentum");
    }
    if (hydrationScore >= 75) {
      anchors.push("Hydration dialed in");
    }
    if (!anchors.length) {
      anchors.push("Opportunity to reset routines");
    }

    const getSleepImpact = (score: number): EnergyImpact => {
      if (score >= 80) return "positive";
      if (score >= 60) return "neutral";
      return "warning";
    };

    const getStressImpact = (score: number): EnergyImpact => {
      if (score <= 45) return "positive";
      if (score <= 65) return "neutral";
      return "warning";
    };

    const getMovementImpact = (score: number): EnergyImpact => {
      if (score >= 70) return "positive";
      if (score >= 45) return "neutral";
      return "warning";
    };

    const keyDrivers: EnergyForecastDriver[] = [
      {
        label: "Sleep rhythm",
        impact: getSleepImpact(sleepScore),
        detail:
          sleepScore >= 80
            ? "Sleep depth supporting high clarity"
            : sleepScore >= 60
            ? "Consistent bedtime will unlock more energy"
            : "Prioritize wind-down to boost tomorrow's charge",
      },
      {
        label: "Nervous system",
        impact: getStressImpact(stressScore),
        detail:
          stressScore <= 45
            ? "Stress load is well regulated"
            : stressScore <= 65
            ? "Micro-recovery moments will keep balance"
            : "Stack breathwork or mindful walks to unload",
      },
      {
        label: "Movement",
        impact: getMovementImpact(movementScore),
        detail:
          movementScore >= 70
            ? "Daily activity is priming your energy"
            : movementScore >= 45
            ? "One more walk will lift the curve"
            : "Layer in low-impact sessions to rebuild momentum",
      },
    ];

    const recommendedActions = [...baseActions[focus]];

    if (focus === "recovery" && sleepScore < 70) {
      recommendedActions.unshift("Block a 30-minute digital sunset before bed");
    }
    if (focus === "push" && movementScore < 80) {
      recommendedActions.unshift("Open the day with an activation circuit to extend the peak");
    }
    if (focus === "balance" && stressScore > 55) {
      recommendedActions.unshift("Bookend the day with 5-minute downshift rituals");
    }

    forecasts.push({
      date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      energyScore: Math.round(energyScore),
      stressScore: Math.round(stressScore),
      focus,
      headline: focusHeadlines[focus],
      anchors,
      keyDrivers,
      recommendedActions: recommendedActions.slice(0, 3),
    });
  }

  return forecasts;
};

