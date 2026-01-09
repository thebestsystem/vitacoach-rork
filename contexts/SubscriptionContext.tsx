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
import Purchases, { CustomerInfo, PurchasesPackage, LOG_LEVEL } from "react-native-purchases";
import Constants from 'expo-constants';
import { Platform } from "react-native";

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
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

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

  // Initialize RevenueCat
  useEffect(() => {
    const initRevenueCat = async () => {
        // Skip in Expo Go or Web if desired, or handle gracefully
        const isExpoGo = Constants.executionEnvironment === 'storeClient';

        if (Platform.OS === 'web' || isExpoGo) {
            logger.info("Skipping RevenueCat initialization (Web or Expo Go)", "Subscription");
            return;
        }

        try {
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);

            if (Platform.OS === 'ios') {
                Purchases.configure({ apiKey: "appl_DUMMY_KEY_FOR_NOW" }); // Replace with env var
            } else if (Platform.OS === 'android') {
                Purchases.configure({ apiKey: "goog_DUMMY_KEY_FOR_NOW" }); // Replace with env var
            }

            if (user?.uid) {
                await Purchases.logIn(user.uid);
            }

            const offerings = await Purchases.getOfferings();
            if (offerings.current && offerings.current.availablePackages.length !== 0) {
                setPackages(offerings.current.availablePackages);
            }

            const info = await Purchases.getCustomerInfo();
            setCustomerInfo(info);

            Purchases.addCustomerInfoUpdateListener((info) => {
                setCustomerInfo(info);
            });

        } catch (e) {
            logger.error("Failed to initialize RevenueCat", e as Error, "Subscription");
        }
    };

    initRevenueCat();
  }, [user?.uid]);

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
    staleTime: 1000 * 60 * 10,
  });

  const quotaQuery = useQuery({
    queryKey: ["quotaUsage", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      return await getQuotaUsage(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
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

  // Determine current plan from RevenueCat or fallback to Firestore
  const currentPlan = useMemo<SubscriptionPlan>(() => {
    if (customerInfo) {
        if (customerInfo.entitlements.active["premium"]) return "premium";
        if (customerInfo.entitlements.active["pro"]) return "pro";
        if (customerInfo.entitlements.active["basic"]) return "basic";
    }
    // Fallback to Firestore/Auth claims
    return subscription?.plan || userClaims?.subscriptionPlan || "free";
  }, [subscription, userClaims, customerInfo]);

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

    const planDefinitions: Record<SubscriptionPlan, { name: string; baseFeatures: string[]; popular?: boolean }> = {
        free: { name: "Free", baseFeatures: ["Basic analytics"] },
        basic: { name: "Basic", baseFeatures: ["Data export"] },
        pro: { name: "Pro", popular: true, baseFeatures: ["Advanced analytics", "Priority AI responses"] },
        premium: { name: "Premium", baseFeatures: ["Priority support", "Custom meal plans", "Personal coach", "API access"] }
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
      // Logic to merge Remote Config prices with RevenueCat packages could go here
      // For now, using Config
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
    // If RevenueCat has active entitlement, we are not in trial (we are paid)
    if (customerInfo?.entitlements.active["pro"] || customerInfo?.entitlements.active["premium"]) return false;

    if (!subscription) return false;
    if (subscription.status !== "trial") return false;
    if (!subscription.trialEndsAt) return false;

    const trialEnd = new Date(subscription.trialEndsAt);
    return trialEnd > new Date();
  }, [subscription, customerInfo]);

  const trialDaysRemaining = useMemo(() => {
    if (!isTrialActive || !subscription?.trialEndsAt) return 0;
    const trialEnd = new Date(subscription.trialEndsAt);
    const now = new Date();
    const diffMs = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [isTrialActive, subscription]);

  const canUpgrade = useMemo(() => {
    const planOrder: SubscriptionPlan[] = ["free", "basic", "pro", "premium"];
    const currentIndex = planOrder.indexOf(currentPlan);
    return currentIndex < planOrder.length - 1;
  }, [currentPlan]);

  const upgradePlanMutation = useMutation({
    mutationFn: async (packageToPurchase: PurchasesPackage | SubscriptionPlan) => {
        if (!user?.uid) throw new Error("User not authenticated");

        // If it's a RevenueCat Package object
        if (typeof packageToPurchase !== 'string' && 'product' in packageToPurchase) {
            try {
                const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
                setCustomerInfo(customerInfo);
                return;
            } catch (e: any) {
                if (!e.userCancelled) {
                    logger.error("Purchase failed", e, "Subscription");
                    throw e;
                }
            }
        }
        // Fallback for string-based plan (Mock/Simulator)
        else {
             logger.info(`Upgrading to ${packageToPurchase} (Mock)`, "Subscription");
             const newPlan = packageToPurchase as SubscriptionPlan;
             const now = new Date();
             const endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();

             const simulatedUpdates: Partial<Subscription> = {
                plan: newPlan,
                status: "active",
                startDate: now.toISOString(),
                endDate,
                cancelAtPeriodEnd: false,
             };

             // Update local state directly for mock
             setSubscription(prev => prev ? { ...prev, ...simulatedUpdates } : null);
             queryClient.setQueryData(["subscription", user?.uid], { ...subscription, ...simulatedUpdates });

             // In reality we should write to Firestore via backend, but here we just update context
             return;
        }
    },
    onSuccess: () => {
      refreshUserClaims();
      queryClient.invalidateQueries({ queryKey: ["quotaUsage", user?.uid] });
    },
  });

  const upgradePlan = useCallback(
    async (planOrPackage: PurchasesPackage | SubscriptionPlan) => {
      return upgradePlanMutation.mutateAsync(planOrPackage);
    },
    [upgradePlanMutation.mutateAsync]
  );

  const restorePurchases = useCallback(async () => {
    try {
        const info = await Purchases.restorePurchases();
        setCustomerInfo(info);
        return true;
    } catch (e) {
        logger.error("Failed to restore purchases", e as Error, "Subscription");
        return false;
    }
  }, []);

  const refreshQuota = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["quotaUsage", user?.uid] });
  }, [queryClient, user?.uid]);

  const incrementQuotaOptimistically = useCallback((quotaType: keyof QuotaUsage, amount: number = 1) => {
      setQuotaUsage(prev => {
          if (!prev) return prev;
          return { ...prev, [quotaType]: (prev[quotaType] as number) + amount };
      });
  }, []);

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
      packages, // Exposed RevenueCat packages
      upgradePlan,
      restorePurchases,
      refreshQuota,
      incrementQuotaOptimistically,
      isLoading: subscriptionQuery.isLoading || quotaQuery.isLoading || isConfigLoading,
      isUpgrading: upgradePlanMutation.isPending,
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
      packages,
      upgradePlan,
      restorePurchases,
      refreshQuota,
      incrementQuotaOptimistically,
      subscriptionQuery.isLoading,
      quotaQuery.isLoading,
      isConfigLoading,
      upgradePlanMutation.isPending,
    ]
  );
});
