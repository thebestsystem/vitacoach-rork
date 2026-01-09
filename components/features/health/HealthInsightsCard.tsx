import React, { useState, memo, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { AlertCircle, TrendingUp, Lightbulb, Award, ChevronRight } from "lucide-react-native";
import type { HealthInsight } from "@/types/health";
import colors from "@/constants/colors";

interface HealthInsightsCardProps {
  insights: HealthInsight[];
  onActionPress?: (insight: HealthInsight) => void;
}

const HealthInsightsCard = memo(function HealthInsightsCard({ insights, onActionPress }: HealthInsightsCardProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Lightbulb size={20} color={colors.primary} strokeWidth={2} />
        <Text style={styles.title}>Health Insights</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onActionPress={onActionPress}
          />
        ))}
      </ScrollView>
    </View>
  );
});

interface InsightCardProps {
  insight: HealthInsight;
  onActionPress?: (insight: HealthInsight) => void;
}

const InsightCard = memo(function InsightCard({ insight, onActionPress }: InsightCardProps) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const iconComponent = useMemo(() => {
    switch (insight.type) {
      case "warning":
        return <AlertCircle size={20} color={colors.warning} strokeWidth={2} />;
      case "achievement":
        return <Award size={20} color={colors.success} strokeWidth={2} />;
      case "suggestion":
        return <Lightbulb size={20} color={colors.secondary} strokeWidth={2} />;
      case "anomaly":
        return <TrendingUp size={20} color={colors.accent} strokeWidth={2} />;
      default:
        return <Lightbulb size={20} color={colors.primary} strokeWidth={2} />;
    }
  }, [insight.type]);

  const cardColor = useMemo(() => {
    switch (insight.priority) {
      case "high":
        return colors.warning;
      case "medium":
        return colors.accent;
      case "low":
        return colors.success;
      default:
        return colors.primary;
    }
  }, [insight.priority]);

  const handlePress = useCallback(() => {
    if (onActionPress) {
      onActionPress(insight);
    }
  }, [onActionPress, insight]);

  if (insight.actionable && onActionPress) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }], borderLeftColor: cardColor },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              {iconComponent}
            </View>
            {insight.icon && <Text style={styles.emoji}>{insight.icon}</Text>}
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {insight.title}
          </Text>
          <Text style={styles.cardMessage} numberOfLines={3}>
            {insight.message}
          </Text>
          {insight.actionable && insight.action && (
            <View style={styles.actionRow}>
              <Text style={styles.actionText}>{insight.action}</Text>
              <ChevronRight size={16} color={colors.primary} strokeWidth={2} />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        { borderLeftColor: cardColor },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          {iconComponent}
        </View>
        {insight.icon && <Text style={styles.emoji}>{insight.icon}</Text>}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {insight.title}
      </Text>
      <Text style={styles.cardMessage} numberOfLines={3}>
        {insight.message}
      </Text>
      {insight.actionable && insight.action && (
        <View style={styles.actionRow}>
          <Text style={styles.actionText}>{insight.action}</Text>
          <ChevronRight size={16} color={colors.primary} strokeWidth={2} />
        </View>
      )}
    </Animated.View>
  );
});

export default HealthInsightsCard;

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: 280,
    borderLeftWidth: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  emoji: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 8,
  },
  cardMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
});
