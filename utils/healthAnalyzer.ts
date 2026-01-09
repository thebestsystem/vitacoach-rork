import type { HealthMetrics, HealthHistory, HealthInsight, AnomalyDetection, UserProfile, WellnessCheckIn } from "@/types/health";

interface AnalysisParams {
  currentMetrics: HealthMetrics;
  history: HealthHistory[];
  checkIns: WellnessCheckIn[];
  userProfile: UserProfile | null;
}

const THRESHOLDS = {
  steps: { min: 5000, target: 10000, deviation: 0.3 },
  heartRate: { min: 60, max: 100, deviation: 0.15 },
  sleep: { min: 6, target: 8, deviation: 0.25 },
  water: { min: 1.5, target: 2.5, deviation: 0.3 },
  calories: { min: 1500, max: 2500, deviation: 0.3 },
  stress: { min: 0, max: 10, healthy: 4, deviation: 0.3 },
};

function calculateAverage(history: HealthHistory[], metric: keyof HealthMetrics): number {
  if (history.length === 0) return 0;
  
  const values = history
    .map((h) => h.metrics[metric])
    .filter((v): v is number => typeof v === "number");
  
  if (values.length === 0) return 0;
  
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateTrend(history: HealthHistory[], metric: keyof HealthMetrics): "improving" | "declining" | "stable" {
  if (history.length < 3) return "stable";
  
  const recentValues = history.slice(-7).map((h) => h.metrics[metric]).filter((v): v is number => typeof v === "number");
  
  if (recentValues.length < 3) return "stable";
  
  const firstHalf = recentValues.slice(0, Math.floor(recentValues.length / 2));
  const secondHalf = recentValues.slice(Math.floor(recentValues.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (Math.abs(change) < 5) return "stable";
  
  const improvingMetrics = ["steps", "sleep", "water"];
  const decliningMetrics = ["stress", "heartRate"];
  
  if (improvingMetrics.includes(metric as string)) {
    return change > 0 ? "improving" : "declining";
  } else if (decliningMetrics.includes(metric as string)) {
    return change < 0 ? "improving" : "declining";
  }
  
  return "stable";
}

export function detectAnomalies(params: AnalysisParams): AnomalyDetection[] {
  const { currentMetrics, history } = params;
  const anomalies: AnomalyDetection[] = [];
  
  if (history.length < 3) return anomalies;
  
  const metricsToCheck: (keyof HealthMetrics)[] = ["steps", "heartRate", "sleep", "water", "calories"];
  
  for (const metric of metricsToCheck) {
    const current = currentMetrics[metric];
    
    if (typeof current !== "number") continue;
    
    const average = calculateAverage(history, metric);
    
    if (average === 0) continue;
    
    const deviation = Math.abs((current - average) / average);
    const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS]?.deviation || 0.3;
    
    if (deviation > threshold) {
      let severity: "low" | "medium" | "high" = "low";
      
      if (deviation > threshold * 2) {
        severity = "high";
      } else if (deviation > threshold * 1.5) {
        severity = "medium";
      }
      
      anomalies.push({
        metric,
        current,
        expected: average,
        deviation,
        severity,
      });
    }
  }
  
  return anomalies;
}

export function generateInsights(params: AnalysisParams): HealthInsight[] {
  const { currentMetrics, history, checkIns, userProfile } = params;
  const insights: HealthInsight[] = [];
  const now = new Date().toISOString();
  
  const anomalies = detectAnomalies(params);
  
  for (const anomaly of anomalies) {
    const isLow = anomaly.current < anomaly.expected;
    const metric = anomaly.metric;
    
    let title = "";
    let message = "";
    let action = "";
    let icon = "";
    
    switch (metric) {
      case "steps":
        if (isLow) {
          title = "Low Activity Detected";
          message = `Your steps are ${Math.round(anomaly.deviation * 100)}% below average. Try a short walk!`;
          action = "Start a walk";
          icon = "👟";
        } else {
          title = "Great Activity!";
          message = `You're ${Math.round(anomaly.deviation * 100)}% more active than usual. Keep it up!`;
          icon = "🎉";
        }
        break;
        
      case "sleep":
        if (isLow) {
          title = "Sleep Deficiency Alert";
          message = `You slept ${anomaly.current}h vs your ${anomaly.expected.toFixed(1)}h average. Prioritize rest tonight.`;
          action = "Create sleep plan";
          icon = "😴";
        } else {
          title = "Excellent Rest";
          message = `Great sleep! You got ${anomaly.current}h, above your average of ${anomaly.expected.toFixed(1)}h.`;
          icon = "✨";
        }
        break;
        
      case "heartRate":
        if (!isLow) {
          title = "Elevated Heart Rate";
          message = `Your resting heart rate is higher than usual. Consider relaxation techniques.`;
          action = "Try breathing exercise";
          icon = "❤️";
        }
        break;
        
      case "water":
        if (isLow) {
          title = "Hydration Alert";
          message = `You're behind on water intake. Drink ${(THRESHOLDS.water.target - anomaly.current).toFixed(1)}L more today.`;
          action = "Log water";
          icon = "💧";
        } else {
          title = "Hydration Goal Met!";
          message = "Excellent hydration today. Your body thanks you!";
          icon = "🌊";
        }
        break;
        
      case "calories":
        if (isLow && userProfile?.goals.includes("muscle_gain")) {
          title = "Low Calorie Intake";
          message = "You're below your calorie target for muscle gain. Consider adding a healthy snack.";
          action = "View meal suggestions";
          icon = "🍎";
        } else if (!isLow && userProfile?.goals.includes("weight_loss")) {
          title = "Calorie Alert";
          message = "You're above your calorie target. Stay mindful of portion sizes.";
          icon = "⚠️";
        }
        break;
    }
    
    if (title && message) {
      insights.push({
        id: `anomaly_${metric}_${Date.now()}`,
        type: "anomaly",
        title,
        message,
        priority: anomaly.severity,
        actionable: !!action,
        action,
        icon,
        timestamp: now,
      });
    }
  }
  
  const stepsTrend = calculateTrend(history, "steps");
  if (stepsTrend === "improving" && currentMetrics.steps >= THRESHOLDS.steps.target) {
    insights.push({
      id: `achievement_steps_${Date.now()}`,
      type: "achievement",
      title: "Streak Alert!",
      message: "You've been consistently hitting your step goals. Amazing progress!",
      priority: "low",
      icon: "🔥",
      timestamp: now,
    });
  }
  
  if (checkIns.length >= 3) {
    const recentCheckIns = checkIns.slice(0, 7);
    const avgStress = recentCheckIns.reduce((sum, ci) => sum + ci.stressLevel, 0) / recentCheckIns.length;
    
    if (avgStress >= 7) {
      insights.push({
        id: `warning_stress_${Date.now()}`,
        type: "warning",
        title: "High Stress Pattern",
        message: "Your stress levels have been elevated lately. Consider meditation or breathing exercises.",
        priority: "high",
        actionable: true,
        action: "Try meditation",
        icon: "🧘",
        timestamp: now,
      });
    }
    
    const avgEnergy = recentCheckIns.reduce((sum, ci) => sum + ci.energyLevel, 0) / recentCheckIns.length;
    if (avgEnergy < 4 && currentMetrics.sleep && currentMetrics.sleep < 7) {
      insights.push({
        id: `suggestion_energy_${Date.now()}`,
        type: "suggestion",
        title: "Energy Boost Needed",
        message: "Low energy and sleep patterns detected. Try improving your sleep routine.",
        priority: "medium",
        actionable: true,
        action: "View sleep tips",
        icon: "⚡",
        timestamp: now,
      });
    }
  }
  
  if (userProfile?.goals.includes("weight_loss")) {
    const weeklySteps = history.slice(-7).reduce((sum, h) => sum + h.metrics.steps, 0);
    if (weeklySteps >= 70000) {
      insights.push({
        id: `achievement_weight_loss_${Date.now()}`,
        type: "achievement",
        title: "Weight Loss Progress",
        message: "You've walked over 70,000 steps this week! This supports your weight loss goal.",
        priority: "medium",
        icon: "🎯",
        timestamp: now,
      });
    }
  }
  
  if (!currentMetrics.water || currentMetrics.water < THRESHOLDS.water.min) {
    insights.push({
      id: `suggestion_hydration_${Date.now()}`,
      type: "suggestion",
      title: "Stay Hydrated",
      message: "Don't forget to drink water throughout the day. Aim for 2.5L daily.",
      priority: "low",
      actionable: true,
      action: "Log water",
      icon: "💧",
      timestamp: now,
    });
  }
  
  insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
  
  return insights.slice(0, 5);
}
