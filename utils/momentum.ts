import type { HealthHistory, MomentumInsight, MomentumTrend, WellnessCheckIn } from "@/types/health";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

interface MomentumOptions {
  history: HealthHistory[];
  checkIns: WellnessCheckIn[];
}

const createInsight = (
  metric: MomentumInsight["metric"],
  change: number,
  unit: string,
  sampleSize: number,
  summary: string,
  action: string
): MomentumInsight => {
  const magnitude = Math.abs(change);
  let trend: MomentumTrend = "stable";

  if (magnitude > 8) {
    trend = change > 0 ? "accelerating" : "slipping";
  } else if (magnitude > 3) {
    trend = change > 0 ? "accelerating" : "slipping";
  }

  const confidence: MomentumInsight["confidence"] = sampleSize >= 10 ? "high" : sampleSize >= 6 ? "medium" : "low";

  return {
    metric,
    label: metric === "steps"
      ? "Movement"
      : metric === "sleep"
      ? "Sleep"
      : metric === "water"
      ? "Hydration"
      : metric === "stress"
      ? "Stress load"
      : "Mood",
    trend,
    change: Math.round(change * 10) / 10,
    unit,
    summary,
    action,
    confidence,
  };
};

const average = (values: number[]) => {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const sliceByPeriod = (history: HealthHistory[], startOffset: number, length: number) => {
  const start = new Date();
  start.setDate(start.getDate() - startOffset);
  const end = new Date(start);
  end.setDate(end.getDate() - (length - 1));

  const startIso = start.toISOString().split("T")[0];
  const endIso = end.toISOString().split("T")[0];

  return history.filter((entry) => entry.date <= startIso && entry.date >= endIso);
};

const computeChange = (recent: number[], previous: number[]) => {
  const recentAvg = average(recent);
  const previousAvg = average(previous);

  if (recentAvg === 0 && previousAvg === 0) {
    return 0;
  }

  if (previousAvg === 0) {
    return recentAvg;
  }

  return ((recentAvg - previousAvg) / previousAvg) * 100;
};

const mapStressChange = (recent: WellnessCheckIn[], previous: WellnessCheckIn[]) => {
  if (!recent.length && !previous.length) {
    return 0;
  }

  const recentAvg = average(recent.map((entry) => entry.stressLevel));
  const previousAvg = average(previous.map((entry) => entry.stressLevel));

  if (previousAvg === 0) {
    return (recentAvg - previousAvg) * 10;
  }

  return (recentAvg - previousAvg) * 10;
};

const mapMoodChange = (recent: WellnessCheckIn[], previous: WellnessCheckIn[]) => {
  if (!recent.length && !previous.length) {
    return 0;
  }

  const moodScore = (mood?: string) => {
    switch (mood) {
      case "excellent":
        return 95;
      case "good":
        return 80;
      case "okay":
        return 65;
      case "low":
        return 50;
      case "struggling":
        return 35;
      default:
        return 65;
    }
  };

  const recentAvg = average(recent.map((entry) => moodScore(entry.mood)));
  const previousAvg = average(previous.map((entry) => moodScore(entry.mood)));

  return recentAvg - previousAvg;
};

export const generateMomentumInsights = ({
  history,
  checkIns,
}: MomentumOptions): MomentumInsight[] => {
  if (!history.length && !checkIns.length) {
    return [];
  }

  const recentHistory = sliceByPeriod(history, 0, 7);
  const previousHistory = sliceByPeriod(history, 7, 7);

  const insights: MomentumInsight[] = [];

  const recentSteps = recentHistory.map((entry) => entry.metrics.steps ?? 0);
  const previousSteps = previousHistory.map((entry) => entry.metrics.steps ?? 0);
  if (recentSteps.length || previousSteps.length) {
    const change = computeChange(recentSteps, previousSteps);
    if (Math.abs(change) >= 3) {
      insights.push(
        createInsight(
          "steps",
          change,
          "%",
          recentSteps.length + previousSteps.length,
          change >= 0
            ? `Daily movement is up ${Math.round(change)}% versus last week`
            : `Movement volume dipped ${Math.round(Math.abs(change))}% week-over-week`,
          change >= 0
            ? "Lock in a progressive overload session to capitalize on momentum"
            : "Schedule a playful walk or mobility flow to restart the streak"
        )
      );
    }
  }

  const recentSleep = recentHistory.map((entry) => entry.metrics.sleep ?? 0);
  const previousSleep = previousHistory.map((entry) => entry.metrics.sleep ?? 0);
  if (recentSleep.length || previousSleep.length) {
    const change = computeChange(recentSleep, previousSleep);
    if (Math.abs(change) >= 2) {
      insights.push(
        createInsight(
          "sleep",
          change,
          "%",
          recentSleep.length + previousSleep.length,
          change >= 0
            ? `Sleep duration climbed ${Math.round(change)}%`
            : `Sleep volume slipped ${Math.round(Math.abs(change))}%`,
          change >= 0
            ? "Add an evening reflection or gratitude ritual to extend this streak"
            : "Audit your pre-sleep routine and bring back a calming ritual"
        )
      );
    }
  }

  const recentWater = recentHistory.map((entry) => entry.metrics.water ?? 0);
  const previousWater = previousHistory.map((entry) => entry.metrics.water ?? 0);
  if (recentWater.length || previousWater.length) {
    const change = computeChange(recentWater, previousWater);
    if (Math.abs(change) >= 5) {
      insights.push(
        createInsight(
          "water",
          change,
          "%",
          recentWater.length + previousWater.length,
          change >= 0
            ? `Hydration average is ${Math.round(change)}% higher`
            : `Hydration consistency dropped ${Math.round(Math.abs(change))}%`,
          change >= 0
            ? "Pre-fill a bottle tonight to keep the cadence going"
            : "Attach hydration to a trigger habit — e.g. meetings or breaks"
        )
      );
    }
  }

  const recentCheckIns = checkIns
    .filter((entry) => recentHistory.find((historyEntry) => historyEntry.date === entry.date) || entry.date >= new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const previousCheckIns = checkIns.filter((entry) => {
    const entryDate = entry.date;
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 13);
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() - 7);
    const startIso = periodStart.toISOString().split("T")[0];
    const endIso = periodEnd.toISOString().split("T")[0];
    return entryDate <= endIso && entryDate >= startIso;
  });

  if (recentCheckIns.length || previousCheckIns.length) {
    const stressChange = clamp(mapStressChange(recentCheckIns, previousCheckIns), -40, 40);
    if (Math.abs(stressChange) >= 5) {
      insights.push(
        createInsight(
          "stress",
          -stressChange,
          "pts",
          recentCheckIns.length + previousCheckIns.length,
          stressChange <= 0
            ? "Stress load is easing off"
            : "Stress spikes showing up more frequently",
          stressChange <= 0
            ? "Celebrate this with a longer recovery block this weekend"
            : "Bookend days with a 4-7-8 breathing sequence"
        )
      );
    }

    const moodChange = clamp(mapMoodChange(recentCheckIns, previousCheckIns), -25, 25);
    if (Math.abs(moodChange) >= 4) {
      insights.push(
        createInsight(
          "mood",
          moodChange,
          "pts",
          recentCheckIns.length + previousCheckIns.length,
          moodChange >= 0 ? "Mood resilience trending up" : "Mood stability wavering",
          moodChange >= 0
            ? "Capture what felt energizing and replicate it tomorrow"
            : "Schedule a joy break or connect with a support partner"
        )
      );
    }
  }

  return insights
    .sort((a, b) => {
      const severityA = a.trend === "slipping" ? 2 : a.trend === "accelerating" ? 1 : 0;
      const severityB = b.trend === "slipping" ? 2 : b.trend === "accelerating" ? 1 : 0;
      if (severityA !== severityB) {
        return severityB - severityA;
      }
      return Math.abs(b.change) - Math.abs(a.change);
    })
    .slice(0, 4);
};

