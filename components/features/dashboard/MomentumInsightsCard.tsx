import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TrendingUp, TrendingDown, Minus, Footprints, Moon, Droplets, Brain, Sparkles } from "lucide-react-native";
import colors from "@/constants/colors";
import type { MomentumInsight } from "@/types/health";

interface MomentumInsightsCardProps {
  insights: MomentumInsight[];
}

const trendIcon = (trend: MomentumInsight["trend"], color: string) => {
  switch (trend) {
    case "accelerating":
      return <TrendingUp size={18} color={color} strokeWidth={2.5} />;
    case "slipping":
      return <TrendingDown size={18} color={color} strokeWidth={2.5} />;
    default:
      return <Minus size={18} color={color} strokeWidth={2.5} />;
  }
};

const metricIcon: Record<MomentumInsight["metric"], React.ReactElement> = {
  steps: <Footprints size={18} color={colors.primary} strokeWidth={2.5} />,
  sleep: <Moon size={18} color={colors.primaryLight} strokeWidth={2.5} />,
  water: <Droplets size={18} color={colors.secondary} strokeWidth={2.5} />,
  stress: <Brain size={18} color={colors.accent} strokeWidth={2.5} />,
  mood: <Sparkles size={18} color={colors.secondary} strokeWidth={2.5} />,
};

const trendColor = (trend: MomentumInsight["trend"]) => {
  switch (trend) {
    case "accelerating":
      return colors.success;
    case "slipping":
      return colors.accent;
    default:
      return colors.textSecondary;
  }
};

const confidenceLabel = (confidence: MomentumInsight["confidence"]) => {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Emerging signal";
    default:
      return "Early signal";
  }
};

const MomentumInsightsCard: React.FC<MomentumInsightsCardProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <TrendingUp size={18} color={colors.primary} strokeWidth={2.5} />
        </View>
        <View>
          <Text style={styles.title}>Momentum Signals</Text>
          <Text style={styles.subtitle}>Where your habits are trending</Text>
        </View>
      </View>

      {insights.map((insight) => {
        const color = trendColor(insight.trend);
        return (
          <View key={`${insight.metric}-${insight.summary}`} style={styles.insightRow}>
            <View style={styles.metricIcon}>{metricIcon[insight.metric]}</View>
            <View style={styles.insightContent}>
              <View style={styles.insightHeader}>
                <Text style={styles.metricLabel}>{insight.label}</Text>
                <View style={[styles.trendBadge, { backgroundColor: color + "15" }]}>
                  {trendIcon(insight.trend, color)}
                  <Text style={[styles.trendText, { color }]}>
                    {insight.trend === "slipping" ? "Needs focus" : insight.trend === "accelerating" ? "Momentum" : "Stable"}
                  </Text>
                </View>
              </View>
              <Text style={styles.summary}>{insight.summary}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.change}>
                  {insight.change > 0 ? "+" : ""}
                  {insight.change}
                  {insight.unit}
                </Text>
                <Text style={styles.confidence}>{confidenceLabel(insight.confidence)}</Text>
              </View>
              <Text style={styles.action}>{insight.action}</Text>
            </View>
          </View>
        );
      })}
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
  header: {
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
  insightRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    marginBottom: 18,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: colors.text,
  },
  trendBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  summary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    marginBottom: 8,
  },
  change: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.text,
  },
  confidence: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  action: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: "600" as const,
  },
});

export default MomentumInsightsCard;

