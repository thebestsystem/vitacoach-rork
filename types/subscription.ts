export type SubscriptionPlan = "free" | "basic" | "pro" | "premium";

export interface QuotaLimits {
  workoutPlansPerMonth: number;
  mealPlansPerMonth: number;
  aiCoachMessagesPerDay: number;
  exerciseLogsPerDay: number;
  mealLogsPerDay: number;
  wellnessCheckInsPerDay: number;
  storageLimit: number;
  dataExportEnabled: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
}

export interface QuotaUsage {
  workoutPlansThisMonth: number;
  mealPlansThisMonth: number;
  aiCoachMessagesToday: number;
  exerciseLogsToday: number;
  mealLogsToday: number;
  wellnessCheckInsToday: number;
  storageUsed: number;
  lastReset: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}
