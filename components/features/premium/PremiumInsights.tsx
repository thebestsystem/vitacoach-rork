import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TrendingUp, Brain, Zap } from "lucide-react-native";
import colors from "@/constants/colors";
import { usePremiumInsights } from "@/hooks/usePremiumInsights";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PremiumLockedFeature from "./PremiumLockedFeature";

export default function PremiumInsightsCard() {
  const { quotaLimits } = useSubscription();
  const { correlations, forecast, isReady } = usePremiumInsights();

  // If not locked, we use real data. If locked, we show placeholder UI behind the lock.
  const isLocked = !quotaLimits?.advancedAnalytics;

  return (
    <View style={styles.wrapper}>
       <Text style={styles.sectionTitle}>Advanced Insights</Text>
       <PremiumLockedFeature isLocked={isLocked}>
          <LinearGradient
            colors={[colors.surface, colors.surface]}
            style={styles.container}
          >
            <View style={styles.grid}>
              {/* Forecast Card */}
              <View style={[styles.card, styles.cardFull]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: colors.primaryLight + "20" }]}>
                     <TrendingUp size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.cardTitle}>Wellness Forecast</Text>
                </View>

                <View style={styles.forecastContent}>
                  <Text style={styles.forecastValue}>
                    {isReady ? forecast.predictedScore : "--"}
                  </Text>
                  <Text style={styles.forecastLabel}>Predicted Score</Text>
                  <View style={[
                      styles.trendBadge,
                      { backgroundColor: forecast.trend === "improving" ? colors.success + "20" : colors.warning + "20" }
                  ]}>
                    <Text style={[
                        styles.trendText,
                        { color: forecast.trend === "improving" ? colors.success : colors.warning }
                    ]}>
                        {forecast.trend.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Correlation Card */}
              <View style={[styles.card, styles.cardFull]}>
                 <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: colors.accent + "20" }]}>
                     <Brain size={20} color={colors.accent} />
                  </View>
                  <Text style={styles.cardTitle}>AI Correlation</Text>
                </View>

                {correlations.length > 0 ? (
                    correlations.map((corr, idx) => (
                        <View key={idx} style={styles.correlationItem}>
                            <Text style={styles.correlationTitle}>{corr.factor}</Text>
                            <Text style={styles.correlationDesc}>{corr.description}</Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            Not enough data to find correlations yet. Keep tracking!
                        </Text>
                    </View>
                )}
              </View>
            </View>
          </LinearGradient>
       </PremiumLockedFeature>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
  },
  cardFull: {
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  forecastContent: {
    alignItems: "center",
    paddingVertical: 8,
  },
  forecastValue: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
  },
  forecastLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "700",
  },
  correlationItem: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  correlationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  correlationDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyState: {
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 13,
  },
});
