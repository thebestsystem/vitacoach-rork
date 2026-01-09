import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import logger from "@/utils/logger";
import { getQuotaUsage } from "@/utils/quotas";
import { getGlobalConfig, GlobalConfig, DEFAULT_CONFIG } from "@/utils/config";
import { SubscriptionPlan, QuotaLimits, QuotaUsage } from "@/types/subscription";

export interface Subscription {
  userId: string;
  plan: SubscriptionPlan;
  status: "active" | "canceled" | "expired" | "trial";
  startDate: string;
  endDate: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  amount?: number;
  currency?: string;
}

export interface PlanFeatures {
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  popular?: boolean;
}

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const { user, userClaims, refreshUserClaims } = useAuth();
  const queryClient = useQueryClient();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [quotaUsage, setQuotaUsage] = useState<QuotaUsage | null>(null);

  // Store the config in state to trigger re-renders when it loads
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(DEFAULT_CONFIG);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  // Initialize config on mount
  useEffect(() => {
    let mounted = true;
    getGlobalConfig().then(config => {
        if (mounted) {
            setGlobalConfig(config);
            setIsConfigLoading(false);
        }
    });
    return () => { mounted = false; };
  }, []);

  const subscriptionQuery = useQuery({
    queryKey: ["subscription", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;

      try {
        const subRef = doc(db, "subscriptions", user.uid);
        const subDoc = await getDoc(subRef);

        if (!subDoc.exists()) {
          logger.info("No subscription found, creating trial", "Subscription", { userId: user.uid });

          const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
          const newSubscription: Subscription = {
            userId: user.uid,
            plan: "free",
            status: "trial",
            startDate: new Date().toISOString(),
            endDate: trialEndsAt,
            trialEndsAt,
            cancelAtPeriodEnd: false,
          };

          await setDoc(subRef, newSubscription);
          return newSubscription;
        }

        return subDoc.data() as Subscription;
      } catch (error) {
        logger.error("Failed to load subscription", error as Error, "Subscription", { userId: user.uid });
        throw error;
      }
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 10, // Increased to 10 minutes to reduce reads
  });

  const quotaQuery = useQuery({
    queryKey: ["quotaUsage", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      return await getQuotaUsage(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // Increased from 30s to 5m. We rely on optimistic updates or invalidation on action.
  });

  useEffect(() => {
    if (subscriptionQuery.data) {
      setSubscription(subscriptionQuery.data);
    }
  }, [subscriptionQuery.data]);

  useEffect(() => {
    if (quotaQuery.data) {
      setQuotaUsage(quotaQuery.data);
    }
  }, [quotaQuery.data]);

  useEffect(() => {
    if (!user?.uid) return;

    logger.debug("Setting up subscription listener", "Subscription", { userId: user.uid });

    const subRef = doc(db, "subscriptions", user.uid);
    const unsubscribe = onSnapshot(
      subRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const newData = docSnap.data() as Subscription;
          
          setSubscription(prev => {
             // Check if data actually changed
             if (JSON.stringify(prev) !== JSON.stringify(newData)) {
                 logger.debug("Subscription updated from snapshot", "Subscription", { plan: newData.plan, status: newData.status });
                 return newData;
             }
             return prev;
          });

          // Perform side effects OUTSIDE the state updater
          // We can't access 'prev' here easily, but we can check if the new data differs from what we *expect* or just update the cache regardless.
          // Updating the query cache is cheap.
          queryClient.setQueryData(["subscription", user.uid], newData);

          // We'll optimistically refresh claims if the plan looks like it might have changed from what we last knew
          // (even if we don't have perfect prev state here, refreshing claims on any snapshot update is safer/better than missing it)
          refreshUserClaims();
        }
      },
      (error) => {
        logger.error("Subscription listener error", error as Error, "Subscription", { userId: user.uid });
      }
    );

    return () => {
      logger.debug("Cleaning up subscription listener", "Subscription");
      unsubscribe();
    };
  }, [user?.uid, queryClient, refreshUserClaims]);

  const upgradePlanMutation = useMutation({
    mutationFn: async (newPlan: SubscriptionPlan) => {
      if (!user?.uid) throw new Error("User not authenticated");

      logger.info(`Upgrading to ${newPlan}`, "Subscription", { userId: user.uid, newPlan });

      // TODO: IMPLEMENT REAL PAYMENT PROCESSING (Stripe / RevenueCat / IAP)
      // SECURITY WARNING: Client-side updates to 'plan' are BLOCKED by firestore.rules for security.
      // In a real app, you would:
      // 1. Call a Cloud Function (e.g., createCheckoutSession)
      // 2. Redirect user to payment
      // 3. Webhook updates the Firestore document

      // FOR DEMO / DEV PURPOSES ONLY:
      // We cannot update Firestore directly here because of rules.
      // We will simulate the success locally.

      const now = new Date();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();

      const simulatedUpdates: Partial<Subscription> = {
        plan: newPlan,
        status: "active",
        startDate: now.toISOString(),
        endDate,
        cancelAtPeriodEnd: false,
      };

      // NOTE: This throws permission-denied in production if we try to write restricted fields.
      // So we skip the write for now and trust the local state update to show the UI change.
      // await updateDoc(subRef, simulatedUpdates as any);

      logger.warn("Simulating subscription upgrade (Backend/IAP required)", "Subscription");

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { ...subscription, ...simulatedUpdates } as Subscription;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["subscription", user?.uid], data);
      // Manually set state to reflect change immediately in UI since we aren't writing to DB
      setSubscription(data);
      refreshUserClaims();
      // Invalidate quota to ensure limits are refreshed immediately
      queryClient.invalidateQueries({ queryKey: ["quotaUsage", user?.uid] });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.uid) throw new Error("User not authenticated");

      logger.info("Canceling subscription", "Subscription", { userId: user.uid });

      const subRef = doc(db, "subscriptions", user.uid);

      const updates: Partial<Subscription> = {
        cancelAtPeriodEnd: true,
      };

      // This IS allowed by security rules
      await updateDoc(subRef, updates as any);

      logger.info("Subscription canceled (end of period)", "Subscription", { userId: user.uid });

      return { ...subscription, ...updates } as Subscription;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["subscription", user?.uid], data);
      setSubscription(data);
    },
  });

  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.uid) throw new Error("User not authenticated");

      logger.info("Reactivating subscription", "Subscription", { userId: user.uid });

      const subRef = doc(db, "subscriptions", user.uid);

      // This requires backend intervention usually if it involves billing, but for simple 'cancelAtPeriodEnd' reversal:
      const updates: Partial<Subscription> = {
        cancelAtPeriodEnd: false,
      };

      // Rules allow updating cancelAtPeriodEnd
      await updateDoc(subRef, updates as any);

      logger.info("Subscription reactivated", "Subscription", { userId: user.uid });

      return { ...subscription, ...updates } as Subscription;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["subscription", user?.uid], data);
      setSubscription(data);
    },
  });

  const currentPlan = useMemo(() => {
    return subscription?.plan || userClaims?.subscriptionPlan || "free";
  }, [subscription, userClaims]);

  const quotaLimits = useMemo<QuotaLimits>(() => {
    return globalConfig.quotas[currentPlan];
  }, [currentPlan, globalConfig]);

  // Helper to format limit strings
  const formatLimit = (value: number, unit: string) => {
      return value === -1 ? `Unlimited ${unit}` : `${value} ${unit}`;
  };

  const planFeatures = useMemo<PlanFeatures>(() => {
    const prices = globalConfig.pricing.plans;
    const quotas = globalConfig.quotas;
    const currency = globalConfig.pricing.currency;

    // Helper to generate features for a specific plan
    const getFeaturesForPlan = (plan: SubscriptionPlan, baseFeatures: string[]) => {
        const pQuota = quotas[plan];
        return [
            formatLimit(pQuota.workoutPlansPerMonth, "workout plans/month"),
            formatLimit(pQuota.mealPlansPerMonth, "meal plans/month"),
            formatLimit(pQuota.aiCoachMessagesPerDay, "AI coach messages/day"),
            ...baseFeatures,
            `${Math.round(pQuota.storageLimit / (1024 * 1024))}MB storage`
        ];
    };

    // Define base/static features for each plan
    const planDefinitions: Record<SubscriptionPlan, { name: string; baseFeatures: string[]; popular?: boolean }> = {
        free: {
            name: "Free",
            baseFeatures: ["Basic analytics"]
        },
        basic: {
            name: "Basic",
            baseFeatures: ["Data export"]
        },
        pro: {
            name: "Pro",
            popular: true,
            baseFeatures: ["Advanced analytics", "Priority AI responses"]
        },
        premium: {
            name: "Premium",
            baseFeatures: ["Priority support", "Custom meal plans", "Personal coach", "API access"]
        }
    };

    const currentPlanDef = planDefinitions[currentPlan];

    return {
        name: currentPlanDef.name,
        price: prices[currentPlan]?.price ?? 0,
        currency: currency,
        interval: "month",
        popular: currentPlanDef.popular,
        features: getFeaturesForPlan(currentPlan, currentPlanDef.baseFeatures)
    };
  }, [currentPlan, globalConfig]);

  const allPlans = useMemo(() => {
      const prices = globalConfig.pricing.plans;
      const quotas = globalConfig.quotas;
      const currency = globalConfig.pricing.currency;

      const getFeaturesForPlan = (plan: SubscriptionPlan, baseFeatures: string[]) => {
        const pQuota = quotas[plan];
        return [
            formatLimit(pQuota.workoutPlansPerMonth, "workout plans/month"),
            formatLimit(pQuota.mealPlansPerMonth, "meal plans/month"),
            formatLimit(pQuota.aiCoachMessagesPerDay, "AI coach messages/day"),
            ...baseFeatures,
            pQuota.storageLimit >= 1024 * 1024 * 1024
                ? `${Math.round(pQuota.storageLimit / (1024 * 1024 * 1024))}GB storage`
                : `${Math.round(pQuota.storageLimit / (1024 * 1024))}MB storage`
        ];
      };

      return {
          free: {
            name: "Free",
            price: prices.free?.price ?? 0,
            currency: currency,
            interval: "month",
            features: getFeaturesForPlan("free", ["Basic analytics"]),
          },
          basic: {
            name: "Basic",
            price: prices.basic?.price ?? 9.99,
            currency: currency,
            interval: "month",
            features: getFeaturesForPlan("basic", ["Data export"]),
          },
          pro: {
            name: "Pro",
            price: prices.pro?.price ?? 19.99,
            currency: currency,
            interval: "month",
            popular: true,
            features: getFeaturesForPlan("pro", ["Advanced analytics", "Priority AI responses"]),
          },
          premium: {
            name: "Premium",
            price: prices.premium?.price ?? 39.99,
            currency: currency,
            interval: "month",
            features: getFeaturesForPlan("premium", ["Priority support", "Custom meal plans", "Personal coach", "API access"]),
          },
      } as Record<SubscriptionPlan, PlanFeatures>;
  }, [globalConfig]);

  const isTrialActive = useMemo(() => {
    if (!subscription) return false;
    if (subscription.status !== "trial") return false;
    if (!subscription.trialEndsAt) return false;

    const trialEnd = new Date(subscription.trialEndsAt);
    return trialEnd > new Date();
  }, [subscription]);

  const trialDaysRemaining = useMemo(() => {
    if (!isTrialActive || !subscription?.trialEndsAt) return 0;

    const trialEnd = new Date(subscription.trialEndsAt);
    const now = new Date();
    const diffMs = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }, [isTrialActive, subscription]);

  const canUpgrade = useMemo(() => {
    const planOrder: SubscriptionPlan[] = ["free", "basic", "pro", "premium"];
    const currentIndex = planOrder.indexOf(currentPlan);
    return currentIndex < planOrder.length - 1;
  }, [currentPlan]);

  const upgradePlan = useCallback(
    async (newPlan: SubscriptionPlan) => {
      return upgradePlanMutation.mutateAsync(newPlan);
    },
    [upgradePlanMutation.mutateAsync]
  );

  const cancelSubscription = useCallback(async () => {
    return cancelSubscriptionMutation.mutateAsync();
  }, [cancelSubscriptionMutation.mutateAsync]);

  const reactivateSubscription = useCallback(async () => {
    return reactivateSubscriptionMutation.mutateAsync();
  }, [reactivateSubscriptionMutation.mutateAsync]);

  const refreshQuota = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["quotaUsage", user?.uid] });
  }, [queryClient, user?.uid]);

  // Optimistic update helper for other contexts to use
  const incrementQuotaOptimistically = useCallback((quotaType: keyof QuotaUsage, amount: number = 1) => {
      setQuotaUsage(prev => {
          if (!prev) return prev;
          return {
              ...prev,
              [quotaType]: (prev[quotaType] as number) + amount
          };
      });
  }, []);

  const restorePurchases = useCallback(async () => {
    if (!user?.uid) return false;
    try {
        const subRef = doc(db, "subscriptions", user.uid);
        const subDoc = await getDoc(subRef);
        if (subDoc.exists()) {
            const data = subDoc.data() as Subscription;
            const now = new Date();
            const endDate = new Date(data.endDate);
            if (endDate > now && data.status === 'active') {
                setSubscription(data);
                queryClient.setQueryData(["subscription", user.uid], data);
                return true;
            }
        }
        return false;
    } catch (error) {
        logger.error("Failed to restore purchases", error as Error, "Subscription");
        throw error;
    }
  }, [user?.uid, queryClient]);

  return useMemo(
    () => ({
      subscription,
      quotaUsage,
      quotaLimits,
      currentPlan,
      planFeatures,
      isTrialActive,
      trialDaysRemaining,
      canUpgrade,
      allPlans,
      upgradePlan,
      cancelSubscription,
      reactivateSubscription,
      restorePurchases,
      refreshQuota,
      incrementQuotaOptimistically, // Exposed for use in HealthContext etc
      isLoading: subscriptionQuery.isLoading || quotaQuery.isLoading || isConfigLoading,
      isUpgrading: upgradePlanMutation.isPending,
      isCanceling: cancelSubscriptionMutation.isPending,
    }),
    [
      subscription,
      quotaUsage,
      quotaLimits,
      currentPlan,
      planFeatures,
      isTrialActive,
      trialDaysRemaining,
      canUpgrade,
      allPlans,
      upgradePlan,
      cancelSubscription,
      reactivateSubscription,
      restorePurchases,
      refreshQuota,
      incrementQuotaOptimistically,
      subscriptionQuery.isLoading,
      quotaQuery.isLoading,
      isConfigLoading,
      upgradePlanMutation.isPending,
      cancelSubscriptionMutation.isPending,
    ]
  );
});
