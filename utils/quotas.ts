import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/config/firebase";
import logger from "@/utils/logger";
import { getGlobalConfig, getCachedConfig } from "@/utils/config";
import { SubscriptionPlan, QuotaLimits, QuotaUsage } from "@/types/subscription";

// Re-export for backward compatibility if needed, though direct import is preferred
export { SubscriptionPlan, QuotaLimits, QuotaUsage };

// Deprecated: Use getQuotaLimits(plan) which fetches from config
// const QUOTA_LIMITS: Record<SubscriptionPlan, QuotaLimits> = ...

export function getQuotaLimits(plan: SubscriptionPlan): QuotaLimits {
  const config = getCachedConfig();
  return config.quotas[plan];
}

export async function getQuotaUsage(userId: string): Promise<QuotaUsage | null> {
  try {
    const quotaRef = doc(db, "quotaUsage", userId);
    const quotaDoc = await getDoc(quotaRef);
    
    if (!quotaDoc.exists()) {
      logger.warn("Quota usage not found, initializing", "Quotas", { userId });
      return await initializeQuotaUsage(userId);
    }
    
    return quotaDoc.data() as QuotaUsage;
  } catch (error) {
    logger.error("Failed to get quota usage", error as Error, "Quotas", { userId });
    throw error;
  }
}

export async function initializeQuotaUsage(userId: string): Promise<QuotaUsage> {
  try {
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    
    const initialUsage: QuotaUsage = {
      workoutPlansThisMonth: 0,
      mealPlansThisMonth: 0,
      aiCoachMessagesToday: 0,
      exerciseLogsToday: 0,
      mealLogsToday: 0,
      wellnessCheckInsToday: 0,
      storageUsed: 0,
      lastReset: now.toISOString(),
      currentPeriodStart,
      currentPeriodEnd,
    };
    
    const quotaRef = doc(db, "quotaUsage", userId);
    await setDoc(quotaRef, initialUsage);
    
    logger.info("Quota usage initialized", "Quotas", { userId });
    return initialUsage;
  } catch (error) {
    logger.error("Failed to initialize quota usage", error as Error, "Quotas", { userId });
    throw error;
  }
}

export async function checkQuota(
  userId: string,
  plan: SubscriptionPlan,
  quotaType: keyof QuotaUsage
): Promise<{ allowed: boolean; usage: number; limit: number }> {
  try {
    // Ensure config is fresh(er) or at least available if this is first run
    await getGlobalConfig();

    const usage = await getQuotaUsage(userId);
    if (!usage) {
      throw new Error("Failed to get quota usage");
    }
    
    const limits = getQuotaLimits(plan);
    
    const limitMap: Record<keyof QuotaUsage, number> = {
      workoutPlansThisMonth: limits.workoutPlansPerMonth,
      mealPlansThisMonth: limits.mealPlansPerMonth,
      aiCoachMessagesToday: limits.aiCoachMessagesPerDay,
      exerciseLogsToday: limits.exerciseLogsPerDay,
      mealLogsToday: limits.mealLogsPerDay,
      wellnessCheckInsToday: limits.wellnessCheckInsPerDay,
      storageUsed: limits.storageLimit,
      lastReset: 0,
      currentPeriodStart: 0,
      currentPeriodEnd: 0,
    };
    
    const limit = limitMap[quotaType];
    const currentUsage = usage[quotaType] as number;
    
    const allowed = limit === -1 || currentUsage < limit;
    
    logger.debug(
      `Quota check: ${quotaType}`,
      "Quotas",
      { userId, plan, allowed, usage: currentUsage, limit }
    );
    
    return { allowed, usage: currentUsage, limit };
  } catch (error) {
    logger.error("Quota check failed", error as Error, "Quotas", { userId, quotaType });
    throw error;
  }
}

export async function incrementQuota(
  userId: string,
  quotaType: keyof QuotaUsage,
  amount: number = 1
): Promise<void> {
  try {
    const quotaRef = doc(db, "quotaUsage", userId);
    
    // Using atomic increment to prevent race conditions
    await updateDoc(quotaRef, {
      [quotaType]: increment(amount),
    });
    
    logger.debug(
      `Quota incremented: ${quotaType} by ${amount}`,
      "Quotas",
      { userId, amount }
    );
  } catch (error) {
    logger.error("Failed to increment quota", error as Error, "Quotas", { userId, quotaType });
    throw error;
  }
}

export async function resetDailyQuotas(userId: string): Promise<void> {
  try {
    const quotaRef = doc(db, "quotaUsage", userId);
    
    await updateDoc(quotaRef, {
      aiCoachMessagesToday: 0,
      exerciseLogsToday: 0,
      mealLogsToday: 0,
      wellnessCheckInsToday: 0,
      lastReset: new Date().toISOString(),
    });
    
    logger.info("Daily quotas reset", "Quotas", { userId });
  } catch (error) {
    logger.error("Failed to reset daily quotas", error as Error, "Quotas", { userId });
    throw error;
  }
}

export async function resetMonthlyQuotas(userId: string): Promise<void> {
  try {
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    
    const quotaRef = doc(db, "quotaUsage", userId);
    
    await updateDoc(quotaRef, {
      workoutPlansThisMonth: 0,
      mealPlansThisMonth: 0,
      currentPeriodStart,
      currentPeriodEnd,
    });
    
    logger.info("Monthly quotas reset", "Quotas", { userId });
  } catch (error) {
    logger.error("Failed to reset monthly quotas", error as Error, "Quotas", { userId });
    throw error;
  }
}

export function getQuotaPercentage(usage: number, limit: number): number {
  if (limit === -1) return 0;
  return Math.min(100, (usage / limit) * 100);
}

export function isQuotaNearLimit(usage: number, limit: number, threshold: number = 0.8): boolean {
  if (limit === -1) return false;
  return usage >= limit * threshold;
}
