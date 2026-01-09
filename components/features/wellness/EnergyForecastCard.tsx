import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Zap, Activity, Shield, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react-native";
import colors from "@/constants/colors";
import type { EnergyForecastDay, EnergyFocus } from "@/types/health";

interface EnergyForecastCardProps {
  forecasts: EnergyForecastDay[];
}

const focusConfig: Record<EnergyFocus, { gradient: readonly [string, string, ...string[]]; accent: string; tag: string }> = {
  recovery: {
    gradient: colors.gradient2 as unknown as readonly [string, string, ...string[]],
    accent: colors.accent,
    tag: "Recovery focus",
  },
  balance: {
    gradient: colors.gradient3 as unknown as readonly [string, string, ...string[]],
    accent: colors.primary,
    tag: "Balanced",
  },
  push: {
    gradient: colors.gradient1 as unknown as readonly [string, string, ...string[]],
    accent: colors.secondary,
    tag: "High-performance",
  },
};

const EnergyForecastCard: React.FC<EnergyForecastCardProps> = ({ forecasts }) => {
  if (!forecasts || forecasts.length === 0) {
    return null;
  }

  const [firstDay, ...nextDays] = forecasts;
  const config = focusConfig[firstDay.focus];

  const getTrendIcon = (energy: number, stress: number) => {
    if (energy >= 72 && stress <= 50) {
      return <ArrowUpRight size={16} color={colors.surface} strokeWidth={2.5} />;
    }
    if (energy <= 58 || stress >= 68) {
      return <ArrowDownRight size={16} color={colors.surface} strokeWidth={2.5} />;
    }
    return <Minus size={16} color={colors.surface} strokeWidth={2.5} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Zap size={18} color={colors.primary} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Energy & Stress Outlook</Text>
          <Text style={styles.subtitle}>Next 72 hours of readiness intelligence</Text>
        </View>
        <View style={[styles.focusTag, { backgroundColor: config.accent + "22" }]}>
          <Text style={[styles.focusTagText, { color: config.accent }]}>{config.tag}</Text>
        </View>
      </View>

      <LinearGradient colors={config.gradient} style={styles.highlightCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.highlightHeader}>
          <Text style={styles.highlightDay}>Today</Text>
          <View style={styles.highlightTrend}>{getTrendIcon(firstDay.energyScore, firstDay.stressScore)}</View>
        </View>
        <Text style={styles.highlightHeadline}>{firstDay.headline}</Text>
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Activity size={18} color={colors.surface} strokeWidth={2.5} />
            <Text style={styles.metricLabel}>Energy</Text>
            <Text style={styles.metricValue}>{firstDay.energyScore}</Text>
          </View>
          <View style={[styles.metricItem, { marginLeft: 24 }]}>
            <Shield size={18} color={colors.surface} strokeWidth={2.5} />
            <Text style={styles.metricLabel}>Stress</Text>
            <Text style={styles.metricValue}>{firstDay.stressScore}</Text>
          </View>
        </View>
        <View style={styles.anchorRow}>
          {firstDay.anchors.map((anchor) => (
            <View key={anchor} style={styles.anchorPill}>
              <Text style={styles.anchorText}>{anchor}</Text>
            </View>
          ))}
        </View>
        <View style={styles.keyDriverList}>
          {firstDay.keyDrivers.map((driver) => (
            <View key={driver.label} style={styles.keyDriverRow}>
              <View
                style={[
                  styles.keyDriverIndicator,
                  driver.impact === "positive"
                    ? styles.keyDriverPositive
                    : driver.impact === "neutral"
                    ? styles.keyDriverNeutral
                    : styles.keyDriverWarning,
                ]}
              />
              <Text style={styles.keyDriverLabel}>{driver.label}</Text>
              <Text style={styles.keyDriverDetail}>{driver.detail}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.actionsSection}>
        <Text style={styles.actionsTitle}>Move with intention</Text>
        {firstDay.recommendedActions.map((action) => (
          <View key={action} style={styles.actionRow}>
            <View style={styles.actionBullet} />
            <Text style={styles.actionText}>{action}</Text>
          </View>
        ))}
      </View>

      {nextDays.length > 0 && (
        <View>
          <Text style={styles.outlookLabel}>Coming up</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.outlookScroll}
          >
            {nextDays.map((day, index) => {
              const nextConfig = focusConfig[day.focus];
              return (
                <View key={day.date} style={styles.outlookCard}>
                  <View style={[styles.outlookTag, { backgroundColor: nextConfig.accent + "22" }]}> 
                    <Text style={[styles.outlookTagText, { color: nextConfig.accent }]}>{nextConfig.tag}</Text>
                  </View>
                  <Text style={styles.outlookDay}>{index === 0 ? "Tomorrow" : `In ${index + 1} days`}</Text>
                  <Text style={styles.outlookHeadline}>{day.headline}</Text>
                  <View style={styles.outlookMetrics}>
                    <Text style={styles.outlookMetric}>Energy {day.energyScore}</Text>
                    <Text style={styles.outlookMetric}>Stress {day.stressScore}</Text>
                  </View>
                  <View style={styles.outlookDrivers}>
                    {day.keyDrivers.slice(0, 2).map((driver) => (
                      <Text key={driver.label} style={styles.outlookDriverText}>
                        • {driver.label}: {driver.detail}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 18,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + "15",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  focusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  focusTagText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  highlightCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  highlightHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  highlightDay: {
    color: colors.surface,
    fontWeight: "600" as const,
    fontSize: 14,
  },
  highlightTrend: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.surface + "55",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  highlightHeadline: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: "row" as const,
    marginBottom: 16,
  },
  metricItem: {
    alignItems: "flex-start" as const,
  },
  metricLabel: {
    color: colors.surface + "CC",
    fontSize: 12,
    marginTop: 4,
  },
  metricValue: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: "700" as const,
    marginTop: 6,
  },
  anchorRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginBottom: 16,
  },
  anchorPill: {
    backgroundColor: colors.surface + "20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  anchorText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "600" as const,
  },
  keyDriverList: {
    gap: 12,
  },
  keyDriverRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 10,
  },
  keyDriverIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  keyDriverPositive: {
    backgroundColor: colors.secondary,
  },
  keyDriverNeutral: {
    backgroundColor: colors.warning,
  },
  keyDriverWarning: {
    backgroundColor: colors.accent,
  },
  keyDriverLabel: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "600" as const,
    flex: 0,
  },
  keyDriverDetail: {
    color: colors.surface + "CC",
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsSection: {
    marginBottom: 18,
  },
  actionsTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    marginBottom: 10,
    gap: 10,
  },
  actionBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  actionText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  outlookLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 12,
  },
  outlookScroll: {
    flexDirection: "row" as const,
    gap: 14,
    paddingRight: 8,
  },
  outlookCard: {
    width: 220,
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  outlookTag: {
    alignSelf: "flex-start" as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  outlookTagText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  outlookDay: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  outlookHeadline: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  outlookMetrics: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 12,
  },
  outlookMetric: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  outlookDrivers: {
    gap: 6,
  },
  outlookDriverText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});

export default EnergyForecastCard;

