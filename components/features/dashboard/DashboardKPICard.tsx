import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import colors from "@/constants/colors";
import type { KPIData } from "@/hooks/useDashboardKPIs";

interface DashboardKPICardProps {
  kpi: KPIData;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  testID?: string;
}

export default function DashboardKPICard({ 
  kpi, 
  size = "medium", 
  style,
  testID 
}: DashboardKPICardProps) {
  const cardStyle = [
    styles.card,
    size === "small" && styles.cardSmall,
    size === "large" && styles.cardLarge,
    style,
  ];

  const showTrend = kpi.trend !== undefined && kpi.trendLabel;
  const isTrendPositive = (kpi.trend || 0) > 0;

  return (
    <View style={cardStyle} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.icon}>{kpi.icon}</Text>
        {showTrend && (
          <View style={[
            styles.trendBadge,
            { backgroundColor: isTrendPositive ? colors.successLight : colors.errorLight }
          ]}>
            {isTrendPositive ? (
              <TrendingUp size={12} color={colors.success} strokeWidth={2} />
            ) : (
              <TrendingDown size={12} color={colors.error} strokeWidth={2} />
            )}
            <Text style={[
              styles.trendText,
              { color: isTrendPositive ? colors.success : colors.error }
            ]}>
              {kpi.trendLabel}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text 
          style={[
            styles.value,
            size === "small" && styles.valueSmall,
            size === "large" && styles.valueLarge,
          ]}
          numberOfLines={1}
        >
          {kpi.value}
        </Text>
        <Text 
          style={[
            styles.label,
            size === "small" && styles.labelSmall,
          ]}
          numberOfLines={2}
        >
          {kpi.label}
        </Text>
      </View>

      <View style={[styles.colorBar, { backgroundColor: kpi.color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 110,
    overflow: "hidden" as const,
  },
  cardSmall: {
    minHeight: 90,
    padding: 12,
  },
  cardLarge: {
    minHeight: 130,
    padding: 20,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 8,
  },
  icon: {
    fontSize: 28,
  },
  trendBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  content: {
    flex: 1,
    justifyContent: "center" as const,
  },
  value: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  valueSmall: {
    fontSize: 20,
  },
  valueLarge: {
    fontSize: 32,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  labelSmall: {
    fontSize: 11,
  },
  colorBar: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
});
