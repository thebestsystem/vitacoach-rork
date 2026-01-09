import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Crown, Zap, Star } from "lucide-react-native";
import colors from "@/constants/colors";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionPlan } from "@/utils/quotas";
import { selectionFeedback } from "@/utils/haptics";
import { Stack } from "expo-router";

const PLAN_ICONS: Record<SubscriptionPlan, typeof Crown> = {
  free: Zap,
  basic: Check,
  pro: Crown,
  premium: Star,
};

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  free: colors.textSecondary,
  basic: colors.secondary,
  pro: colors.primary,
  premium: colors.accent,
};

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentPlan,
    subscription,
    isTrialActive,
    trialDaysRemaining,
    allPlans,
    upgradePlan,
    cancelSubscription,
    reactivateSubscription,
    restorePurchases,
    isUpgrading,
    isCanceling,
  } = useSubscription();

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return;

    selectionFeedback();

    Alert.alert(
      "Upgrade Plan",
      `Upgrade to ${allPlans[plan].name} for $${allPlans[plan].price}/${allPlans[plan].interval}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade",
          onPress: async () => {
            try {
              await upgradePlan(plan);
              Alert.alert("Success", "Your plan has been upgraded!");
            } catch {
              Alert.alert("Error", "Failed to upgrade plan. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancel Subscription",
      "Your subscription will remain active until the end of your billing period. Are you sure?",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription();
              Alert.alert("Canceled", "Your subscription will end at the current period.");
            } catch {
              Alert.alert("Error", "Failed to cancel subscription.");
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    try {
      await reactivateSubscription();
      Alert.alert("Reactivated", "Your subscription has been reactivated!");
    } catch {
      Alert.alert("Error", "Failed to reactivate subscription.");
    }
  };

  const getPlanButtonText = (plan: SubscriptionPlan): string => {
    if (plan === currentPlan) return "Current Plan";
    if (currentPlan === "free") return "Get Started";
    return "Upgrade";
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: "Subscription", headerShown: true }} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isTrialActive && (
          <View style={styles.trialBanner}>
            <Crown size={20} color={colors.primary} strokeWidth={2} />
            <Text style={styles.trialText}>
              {trialDaysRemaining} days left in your trial
            </Text>
          </View>
        )}

        {subscription?.cancelAtPeriodEnd && (
          <View style={[styles.trialBanner, styles.warningBanner]}>
            <Text style={styles.warningText}>
              Subscription ends on {new Date(subscription.endDate).toLocaleDateString()}
            </Text>
            <TouchableOpacity
              style={styles.reactivateButton}
              onPress={handleReactivate}
            >
              <Text style={styles.reactivateButtonText}>Reactivate</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Upgrade anytime to unlock more features
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {(Object.keys(allPlans) as SubscriptionPlan[]).map((planKey) => {
            const plan = allPlans[planKey];
            const isCurrentPlan = planKey === currentPlan;
            const PlanIcon = PLAN_ICONS[planKey];
            const planColor = PLAN_COLORS[planKey];

            return (
              <View
                key={planKey}
                style={[
                  styles.planCard,
                  isCurrentPlan && styles.planCardActive,
                  plan.popular && styles.planCardPopular,
                ]}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}

                <View style={[styles.planIconContainer, { backgroundColor: planColor + "20" }]}>
                  <PlanIcon size={32} color={planColor} strokeWidth={2} />
                </View>

                <Text style={styles.planName}>{plan.name}</Text>

                <View style={styles.priceContainer}>
                  <Text style={styles.currency}>$</Text>
                  <Text style={styles.price}>{plan.price}</Text>
                  <Text style={styles.interval}>/{plan.interval}</Text>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Check size={16} color={colors.success} strokeWidth={2} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.planButton,
                    isCurrentPlan && styles.planButtonActive,
                    plan.popular && styles.planButtonPopular,
                  ]}
                  onPress={() => handleUpgrade(planKey)}
                  disabled={isCurrentPlan || isUpgrading}
                  testID={`plan-button-${planKey}`}
                >
                  <Text
                    style={[
                      styles.planButtonText,
                      isCurrentPlan && styles.planButtonTextActive,
                    ]}
                  >
                    {isUpgrading ? "Processing..." : getPlanButtonText(planKey)}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={async () => {
            selectionFeedback();
            try {
              const restored = await restorePurchases();
              if (restored) {
                Alert.alert("Success", "Your purchases have been restored.");
              } else {
                Alert.alert("No Purchases Found", "We couldn't find any active subscriptions to restore.");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to restore purchases. Please try again.");
            }
          }}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {currentPlan !== "free" && !subscription?.cancelAtPeriodEnd && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSubscription}
            disabled={isCanceling}
          >
            <Text style={styles.cancelButtonText}>
              {isCanceling ? "Canceling..." : "Cancel Subscription"}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  trialBanner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.primaryLight + "20",
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  trialText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
    flex: 1,
  },
  warningBanner: {
    backgroundColor: colors.warning + "20",
    borderLeftColor: colors.warning,
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.warning,
    flex: 1,
  },
  reactivateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reactivateButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.surface,
  },
  header: {
    marginTop: 32,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  plansContainer: {
    gap: 20,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.border,
    position: "relative" as const,
  },
  planCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + "10",
  },
  planCardPopular: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  popularBadge: {
    position: "absolute" as const,
    top: -12,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.surface,
  },
  planIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    marginBottom: 24,
  },
  currency: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 8,
  },
  price: {
    fontSize: 48,
    fontWeight: "700" as const,
    color: colors.text,
    lineHeight: 48,
  },
  interval: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  planButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  planButtonActive: {
    backgroundColor: colors.border,
  },
  planButtonPopular: {
    backgroundColor: colors.primary,
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.surface,
  },
  planButtonTextActive: {
    color: colors.textSecondary,
  },
  cancelButton: {
    marginTop: 32,
    paddingVertical: 14,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.error,
  },
  restoreButton: {
    marginTop: 20,
    alignItems: "center" as const,
    paddingVertical: 10,
  },
  restoreButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
});
