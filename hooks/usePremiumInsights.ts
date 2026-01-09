import { useMemo } from "react";
import { useHealth } from "@/contexts/HealthContext";

export interface CorrelationData {
  factor: string;
  impact: string; // "High", "Medium", "Low"
  direction: "positive" | "negative" | "neutral";
  score: number; // -1 to 1
  description: string;
}

export interface WellnessForecast {
  predictedScore: number;
  trend: "improving" | "declining" | "stable";
  confidence: number; // 0 to 1
}

export interface PremiumInsightsData {
  correlations: CorrelationData[];
  forecast: WellnessForecast;
  isReady: boolean;
}

export function usePremiumInsights(): PremiumInsightsData {
  const { healthHistory, healthMetrics } = useHealth();

  const correlations = useMemo(() => {
    if (healthHistory.length < 7) return [];

    // correlations to check
    // 1. Steps vs Sleep
    // 2. Steps vs Mood

    const steps = healthHistory.map(h => h.metrics.steps || 0);
    const sleep = healthHistory.map(h => h.metrics.sleep || 0);

    // Simple Pearson correlation
    const calculateCorrelation = (x: number[], y: number[]) => {
      const n = x.length;
      if (n === 0) return 0;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
      const sumX2 = x.reduce((a, b) => a + b * b, 0);
      const sumY2 = y.reduce((a, b) => a + b * b, 0);

      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

      if (denominator === 0) return 0;
      return numerator / denominator;
    };

    const stepsSleepCorr = calculateCorrelation(steps, sleep);

    const results: CorrelationData[] = [];

    // Steps vs Sleep Analysis
    if (Math.abs(stepsSleepCorr) > 0.3) {
      results.push({
        factor: "Activity & Sleep",
        impact: Math.abs(stepsSleepCorr) > 0.6 ? "High" : "Medium",
        direction: stepsSleepCorr > 0 ? "positive" : "negative",
        score: stepsSleepCorr,
        description: stepsSleepCorr > 0
          ? "Higher activity levels are strongly linked to better sleep quality for you."
          : "Surprisingly, higher activity days seem to correlate with less sleep.",
      });
    }

    return results;
  }, [healthHistory]);

  const forecast = useMemo(() => {
    // Simple trend prediction based on last 7 days of "wellness score" (simplified as steps + sleep/8 * 10000)
    // This is a dummy logic for the MVP premium feature
    if (healthHistory.length < 3) {
      return { predictedScore: 0, trend: "stable", confidence: 0 } as WellnessForecast;
    }

    const recent = healthHistory.slice(-7);
    const scores = recent.map(h => {
        const sleepScore = ((h.metrics.sleep || 0) / 8) * 50;
        const stepScore = (Math.min((h.metrics.steps || 0), 10000) / 10000) * 50;
        return sleepScore + stepScore;
    });

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const last = scores[scores.length - 1];
    const trend = last > avg ? "improving" : last < avg ? "declining" : "stable";

    return {
        predictedScore: Math.round(avg),
        trend,
        confidence: 0.8
    } as WellnessForecast;

  }, [healthHistory]);

  return {
    correlations,
    forecast,
    isReady: healthHistory.length >= 3
  };
}
