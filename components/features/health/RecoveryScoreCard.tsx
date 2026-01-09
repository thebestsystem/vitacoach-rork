import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight, ArrowDownRight, Droplets, HeartPulse, Moon, Brain, Activity } from "lucide-react-native";
import colors from "@/constants/colors";
import type { HealthHistory, HealthMetrics, WellnessCheckIn } from "@/types/health";
import { calculateRecoveryScore, type RecoveryTrend } from "@/utils/recovery";

interface RecoveryScoreCardProps {
  metrics?: HealthMetrics | null;
  history: HealthHistory[];
  checkIns: WellnessCheckIn[];
  hydrationTarget: number;
}

const statusConfig = {
  recharge: {
    label: "Prioritize Recovery",
    badgeColor: colors.accent,
    gradient: colors.gradient2 as unknown as readonly [string, string, ...string[]],
  },
  maintain: {
    label: "Steady Energy",
    badgeColor: colors.primary,
    gradient: colors.gradient3 as unknown as readonly [string, string, ...string[]],
  },
  perform: {
    label: "Peak Ready",
    badgeColor: colors.secondary,
    gradient: colors.gradient1 as unknown as readonly [string, string, ...string[]],
  },
} as const;

const trendIcon: Record<RecoveryTrend, React.ReactElement> = {
  up: <ArrowUpRight size={16} color={colors.success} strokeWidth={2.5} />,
  steady: <Activity size={16} color={colors.primary} strokeWidth={2.5} />,
  down: <ArrowDownRight size={16} color={colors.accent} strokeWidth={2.5} />,
};

const getIconForLabel = (label: string) => {
  switch (label) {
    case "Restoration":
      return <Moon size={18} color={colors.primaryLight} strokeWidth={2.5} />;
    case "Hydration":
      return <Droplets size={18} color={colors.secondary} strokeWidth={2.5} />;
    case "Mood":
      return <Brain size={18} color={colors.accent} strokeWidth={2.5} />;
    case "Stress":
      return <Activity size={18} color={colors.warning} strokeWidth={2.5} />;
    case "Heart":
      return <HeartPulse size={18} color={colors.primary} strokeWidth={2.5} />;
    default:
      return null;
  }
};

const RecoveryScoreCard: React.FC<RecoveryScoreCardProps> = ({ metrics, history, checkIns, hydrationTarget }) => {
  const recovery = React.useMemo(
    () =>
      calculateRecoveryScore({
        current: metrics,
        history,
        checkIns,
        hydrationTarget,
      }),
    [metrics, history, checkIns, hydrationTarget]
  );

  if (!recovery) {
    return null;
  }

  const config = statusConfig[recovery.status];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Recovery Readiness</Text>
          <Text style={styles.subtitle}>{recovery.headline}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: config.badgeColor }]}>
          <Text style={styles.badgeText}>{config.label}</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <LinearGradient colors={config.gradient} style={styles.scoreCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.scoreValue}>{recovery.score}</Text>
          <Text style={styles.scoreLabel}>/100</Text>
        </LinearGradient>
        <View style={styles.trendContainer}>
          <View style={styles.trendRow}>
            {trendIcon[recovery.trend]}
            <Text style={styles.trendLabel}>
              {recovery.trend === "up"
                ? "Momentum building"
                : recovery.trend === "down"
                ? "Energy tapering"
                : "Consistent flow"}
            </Text>
          </View>
          <Text style={styles.trendHint}>Based on your recent activity patterns</Text>
        </View>
      </View>

      <View style={styles.breakdownGrid}>
        {recovery.breakdown.map((item) => (
          <View key={item.label} style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              {getIconForLabel(item.label)}
              <Text style={styles.breakdownLabel}>{item.label}</Text>
            </View>
            <Text style={styles.breakdownScore}>{item.score}</Text>
            <Text style={styles.breakdownValue}>{item.valueLabel}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(item.score, 100)}%` }]} />
            </View>
            <Text style={styles.breakdownInsight}>{item.insight}</Text>
          </View>
        ))}
      </View>

      {recovery.recommendations.length > 0 && (
        <View style={styles.recommendations}>
          <Text style={styles.recommendationsTitle}>Micro-adjustments for today</Text>
          {recovery.recommendations.map((recommendation) => (
            <View key={recommendation} style={styles.recommendationItem}>
              <View style={styles.recommendationBullet} />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  scoreRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginTop: 20,
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.surface,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.surface,
    opacity: 0.7,
  },
  trendContainer: {
    flex: 1,
    marginLeft: 20,
  },
  trendRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  trendLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600" as const,
  },
  trendHint: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  breakdownGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 14,
    marginTop: 12,
  },
  breakdownItem: {
    width: "47%",
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: 14,
  },
  breakdownHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.text,
  },
  breakdownScore: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
  },
  breakdownValue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  breakdownInsight: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  recommendations: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 10,
  },
  recommendationItem: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 10,
    marginBottom: 8,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default RecoveryScoreCard;
