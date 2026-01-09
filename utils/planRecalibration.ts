import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type {
  UserProfile,
  WorkoutPlan,
  MealPlan,
  MentalWellnessPlan,
  HealthHistory,
  WellnessCheckIn,
  ExerciseLog,
  MealLog,
} from "@/types/health";

export interface BiometricContext {
  avgSleepHours: number;
  sleepTrend: "improving" | "declining" | "stable";
  avgStressLevel: number;
  stressTrend: "improving" | "declining" | "stable";
  avgEnergyLevel: number;
  energyTrend: "improving" | "declining" | "stable";
  avgHeartRate?: number;
  recoveryScore: number;
  workoutCompletionRate: number;
  mealComplianceRate: number;
  consistencyScore: number;
}

export interface RecalibrationRecommendation {
  id: string;
  type: "workout" | "meal" | "mental_wellness";
  severity: "minor" | "moderate" | "major";
  reason: string;
  biometricTriggers: string[];
  changes: {
    before: string;
    after: string;
  }[];
  expectedBenefits: string[];
  appliedAt?: string;
  planId?: string;
}

export interface RecalibrationSuggestion {
  recommendations: RecalibrationRecommendation[];
  summary: string;
  urgency: "low" | "medium" | "high";
  autoApplyRecommended: boolean;
}

function calculateBiometricContext(
  history: HealthHistory[],
  checkIns: WellnessCheckIn[],
  exerciseLogs: ExerciseLog[],
  mealLogs: MealLog[],
  workoutPlans: WorkoutPlan[],
  mealPlans: MealPlan[]
): BiometricContext {
  const recentHistory = history.slice(-14);
  const recentCheckIns = checkIns.slice(-14);

  const sleepData = recentHistory
    .map((h) => h.metrics.sleep)
    .filter((s): s is number => typeof s === "number");
  const avgSleepHours = sleepData.length > 0 
    ? sleepData.reduce((sum, s) => sum + s, 0) / sleepData.length 
    : 7;

  const stressData = recentCheckIns.map((ci) => ci.stressLevel);
  const avgStressLevel = stressData.length > 0 
    ? stressData.reduce((sum, s) => sum + s, 0) / stressData.length 
    : 5;

  const energyData = recentCheckIns.map((ci) => ci.energyLevel);
  const avgEnergyLevel = energyData.length > 0 
    ? energyData.reduce((sum, e) => sum + e, 0) / energyData.length 
    : 5;

  const heartRateData = recentHistory
    .map((h) => h.metrics.heartRate)
    .filter((hr): hr is number => typeof hr === "number");
  const avgHeartRate = heartRateData.length > 0 
    ? heartRateData.reduce((sum, hr) => sum + hr, 0) / heartRateData.length 
    : undefined;

  const calculateTrend = (data: number[]): "improving" | "declining" | "stable" => {
    if (data.length < 4) return "stable";
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (Math.abs(change) < 5) return "stable";
    return change > 0 ? "improving" : "declining";
  };

  const sleepTrend = calculateTrend(sleepData);
  const stressTrend = calculateTrend(stressData.map(s => 10 - s));
  const energyTrend = calculateTrend(energyData);

  const recentExerciseLogs = exerciseLogs.slice(-14);
  const recentMealLogs = mealLogs.slice(-14);

  const workoutCompletionRate = workoutPlans.length > 0 && recentExerciseLogs.length > 0
    ? Math.min(recentExerciseLogs.length / (workoutPlans.length * 7), 1)
    : 0.5;

  const mealComplianceRate = mealPlans.length > 0 && recentMealLogs.length > 0
    ? Math.min(recentMealLogs.length / (mealPlans.length * 3 * 7), 1)
    : 0.5;

  const recoveryScore = Math.min(
    100,
    Math.max(
      0,
      (avgSleepHours / 8) * 40 +
        ((10 - avgStressLevel) / 10) * 30 +
        (avgEnergyLevel / 10) * 30
    )
  );

  const consistencyScore = Math.min(
    100,
    (workoutCompletionRate * 50 + mealComplianceRate * 50)
  );

  return {
    avgSleepHours,
    sleepTrend,
    avgStressLevel,
    stressTrend,
    avgEnergyLevel,
    energyTrend,
    avgHeartRate,
    recoveryScore,
    workoutCompletionRate,
    mealComplianceRate,
    consistencyScore,
  };
}

const recalibrationSchema = z.object({
  recommendations: z.array(
    z.object({
      type: z.enum(["workout", "meal", "mental_wellness"]),
      severity: z.enum(["minor", "moderate", "major"]),
      reason: z.string(),
      biometricTriggers: z.array(z.string()),
      changes: z.array(
        z.object({
          before: z.string(),
          after: z.string(),
        })
      ),
      expectedBenefits: z.array(z.string()),
    })
  ),
  summary: z.string(),
  urgency: z.enum(["low", "medium", "high"]),
  autoApplyRecommended: z.boolean(),
});

export async function analyzeAndSuggestRecalibration(
  userProfile: UserProfile,
  currentWorkoutPlans: WorkoutPlan[],
  currentMealPlans: MealPlan[],
  currentMentalPlans: MentalWellnessPlan[],
  healthHistory: HealthHistory[],
  wellnessCheckIns: WellnessCheckIn[],
  exerciseLogs: ExerciseLog[],
  mealLogs: MealLog[]
): Promise<RecalibrationSuggestion> {
  console.log("🔄 Analyzing biometric data for plan recalibration...");

  const biometricContext = calculateBiometricContext(
    healthHistory,
    wellnessCheckIns,
    exerciseLogs,
    mealLogs,
    currentWorkoutPlans,
    currentMealPlans
  );

  const profileContext = `
User Profile:
- Name: ${userProfile.name}
- Age: ${userProfile.age || "Not specified"}
- Fitness Level: ${userProfile.fitnessLevel || "Not specified"}
- Goals: ${userProfile.goals.join(", ")}
- Health Conditions: ${userProfile.healthConditions?.join(", ") || "None"}

Biometric Context (Last 14 days):
- Average Sleep: ${biometricContext.avgSleepHours.toFixed(1)} hours/night (${biometricContext.sleepTrend})
- Average Stress: ${biometricContext.avgStressLevel.toFixed(1)}/10 (${biometricContext.stressTrend})
- Average Energy: ${biometricContext.avgEnergyLevel.toFixed(1)}/10 (${biometricContext.energyTrend})
${biometricContext.avgHeartRate ? `- Average Heart Rate: ${biometricContext.avgHeartRate.toFixed(0)} bpm` : ""}
- Recovery Score: ${biometricContext.recoveryScore.toFixed(0)}/100
- Workout Completion: ${(biometricContext.workoutCompletionRate * 100).toFixed(0)}%
- Meal Compliance: ${(biometricContext.mealComplianceRate * 100).toFixed(0)}%
- Consistency Score: ${biometricContext.consistencyScore.toFixed(0)}/100

Current Plans:
- Workout Plans: ${currentWorkoutPlans.length} active (${currentWorkoutPlans.map(p => `${p.title} - ${p.difficulty}`).join(", ") || "None"})
- Meal Plans: ${currentMealPlans.length} active (${currentMealPlans.map(p => p.title).join(", ") || "None"})
- Mental Wellness Plans: ${currentMentalPlans.length} active (${currentMentalPlans.map(p => p.title).join(", ") || "None"})
`;

  const result = await generateObject({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "user",
        content: `${profileContext}

You are an intelligent wellness coach AI that analyzes biometric data to suggest plan recalibrations.

Based on the biometric trends and user data above, analyze whether the current plans need to be adjusted. Consider:

1. **Recovery & Fatigue Signals**:
   - Low sleep (<7h average) or declining sleep trend → reduce workout intensity
   - High stress (>7/10) or declining stress trend → add more recovery/mental wellness
   - Low energy (<4/10) or declining energy → adjust workout difficulty
   - Low recovery score (<50) → prioritize rest and recovery

2. **Adherence Patterns**:
   - Low completion rates (<60%) → plans might be too difficult or time-consuming
   - High completion rates (>90%) → user might be ready for progression

3. **Goal Alignment**:
   - Plans should match user's current capacity and goals
   - Adjust intensity based on real performance data

Provide specific, actionable recommendations for recalibrating workout, meal, or mental wellness plans.
Each recommendation should include:
- Clear before/after changes
- Biometric triggers that led to this recommendation
- Expected benefits

Be conservative - only suggest changes when biometric data clearly indicates a need.
Minor adjustments (like reducing sets or adding recovery time) can be auto-applied.
Major changes (like changing workout type or meal structure) should require user approval.`,
      },
    ],
    schema: recalibrationSchema,
  });

  const recommendations: RecalibrationRecommendation[] = result.object.recommendations.map(
    (rec, index) => ({
      id: `recal_${Date.now()}_${index}`,
      ...rec,
    })
  );

  console.log(`✅ Generated ${recommendations.length} recalibration recommendations`);

  return {
    recommendations,
    summary: result.object.summary,
    urgency: result.object.urgency,
    autoApplyRecommended: result.object.autoApplyRecommended,
  };
}

export async function applyWorkoutRecalibration(
  plan: WorkoutPlan,
  recommendation: RecalibrationRecommendation,
  userProfile: UserProfile
): Promise<WorkoutPlan> {
  console.log(`🔧 Applying recalibration to workout plan: ${plan.title}`);

  const adjustmentContext = `
Original Plan:
- Title: ${plan.title}
- Duration: ${plan.duration} minutes
- Difficulty: ${plan.difficulty}
- Exercises: ${plan.exercises.length}

Recommended Changes:
${recommendation.changes.map((c) => `- ${c.before} → ${c.after}`).join("\n")}

Reason: ${recommendation.reason}
`;

  const result = await generateObject({
    model: {} as any, // Placeholder for model
    messages: [
      {
        role: "user",
        content: `${adjustmentContext}

Create an updated version of this workout plan that incorporates the recommended changes.
Maintain the same format but adjust difficulty, duration, rest periods, or exercise selection as needed.
Keep the plan realistic and achievable for the user's current biometric state.`,
      },
    ],
    schema: z.object({
      title: z.string(),
      description: z.string(),
      duration: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      exercises: z.array(
        z.object({
          name: z.string(),
          duration: z.number().optional(),
          reps: z.number().optional(),
          sets: z.number().optional(),
          rest: z.number().optional(),
        })
      ),
    }),
  });

  return {
    ...result.object,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
}

export async function applyMealRecalibration(
  plan: MealPlan,
  recommendation: RecalibrationRecommendation,
  userProfile: UserProfile
): Promise<MealPlan> {
  console.log(`🔧 Applying recalibration to meal plan: ${plan.title}`);

  const adjustmentContext = `
Original Plan:
- Title: ${plan.title}
- Total Calories: ${plan.totalCalories}
- Meals: ${plan.meals.length}

Recommended Changes:
${recommendation.changes.map((c) => `- ${c.before} → ${c.after}`).join("\n")}

Reason: ${recommendation.reason}
`;

  const result = await generateObject({
    model: {} as any, // Placeholder for model
    messages: [
      {
        role: "user",
        content: `${adjustmentContext}

Create an updated version of this meal plan that incorporates the recommended changes.
Adjust calories, macros, or meal timing as needed while respecting dietary preferences and allergies.
Maintain nutritional balance and practical meal preparation.`,
      },
    ],
    schema: z.object({
      title: z.string(),
      description: z.string(),
      totalCalories: z.number(),
      meals: z.array(
        z.object({
          type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
          name: z.string(),
          calories: z.number(),
          protein: z.number(),
          carbs: z.number(),
          fats: z.number(),
          description: z.string().optional(),
        })
      ),
    }),
  });

  return {
    ...result.object,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
}

export async function applyMentalWellnessRecalibration(
  plan: MentalWellnessPlan,
  recommendation: RecalibrationRecommendation,
  userProfile: UserProfile
): Promise<MentalWellnessPlan> {
  console.log(`🔧 Applying recalibration to mental wellness plan: ${plan.title}`);

  const adjustmentContext = `
Original Plan:
- Title: ${plan.title}
- Category: ${plan.category}
- Duration: ${plan.duration} minutes
- Activities: ${plan.activities.length}

Recommended Changes:
${recommendation.changes.map((c) => `- ${c.before} → ${c.after}`).join("\n")}

Reason: ${recommendation.reason}
`;

  const result = await generateObject({
    model: {} as any, // Placeholder for model
    messages: [
      {
        role: "user",
        content: `${adjustmentContext}

Create an updated version of this mental wellness plan that incorporates the recommended changes.
Adjust activity types, durations, or frequencies based on the user's current stress and energy levels.
Focus on practical, achievable mental wellness activities.`,
      },
    ],
    schema: z.object({
      title: z.string(),
      description: z.string(),
      duration: z.number(),
      category: z.enum([
        "stress_management",
        "meditation",
        "breathing",
        "mindfulness",
        "sleep_improvement",
      ]),
      activities: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          duration: z.number(),
          frequency: z.string(),
          benefits: z.array(z.string()).optional(),
        })
      ),
    }),
  });

  return {
    ...result.object,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
}

export function shouldTriggerRecalibration(biometricContext: BiometricContext): boolean {
  const triggers = [
    biometricContext.avgSleepHours < 6.5,
    biometricContext.sleepTrend === "declining",
    biometricContext.avgStressLevel > 7,
    biometricContext.stressTrend === "declining",
    biometricContext.avgEnergyLevel < 4,
    biometricContext.energyTrend === "declining",
    biometricContext.recoveryScore < 50,
    biometricContext.workoutCompletionRate < 0.5,
    biometricContext.workoutCompletionRate > 0.95,
    biometricContext.mealComplianceRate < 0.5,
  ];

  const triggerCount = triggers.filter(Boolean).length;

  return triggerCount >= 2;
}
