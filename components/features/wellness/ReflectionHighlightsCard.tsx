import { PenLine, Sparkles, Zap } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import colors from "@/constants/colors";
import type { ReflectionSummary } from "@/types/health";

interface ReflectionHighlightsCardProps {
  summary: ReflectionSummary;
  onNewReflection: () => void;
}

export default function ReflectionHighlightsCard({ summary, onNewReflection }: ReflectionHighlightsCardProps) {
  const hasEntries = summary.totalEntries > 0;
  const formattedMood = summary.dominantMood
    ? `${summary.dominantMood.charAt(0).toUpperCase()}${summary.dominantMood.slice(1)}`
    : "-";
  const formattedEnergy = summary.averageEnergy !== null ? summary.averageEnergy : "-";

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <Sparkles size={20} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.title}>Reflection Signal</Text>
        </View>
        <TouchableOpacity style={styles.logButton} onPress={onNewReflection} activeOpacity={0.85}>
          <PenLine size={16} color={colors.primary} strokeWidth={2.3} />
          <Text style={styles.logButtonText}>Log reflection</Text>
        </TouchableOpacity>
      </View>

      {!hasEntries ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Build your awareness streak</Text>
          <Text style={styles.emptyDescription}>
            Capture a gratitude, a friction point, and tomorrow&apos;s intention to unlock your coach playbook.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{summary.activeStreak}</Text>
              <Text style={styles.statLabel}>day streak</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{formattedEnergy}</Text>
              <Text style={styles.statLabel}>avg energy</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{formattedMood}</Text>
              <Text style={styles.statLabel}>dominant mood</Text>
            </View>
          </View>

          {summary.topThemes.length > 0 && (
            <View style={styles.themeRow}>
              {summary.topThemes.map((theme) => (
                <View key={theme.label} style={styles.themePill}>
                  <Zap size={14} color={colors.secondaryDark} strokeWidth={2.5} />
                  <Text style={styles.themeText}>{theme.label}</Text>
                </View>
              ))}
            </View>
          )}

          {summary.highlight && <Text style={styles.highlight}>{summary.highlight}</Text>}

          {summary.nextStep && <Text style={styles.nextStep}>{summary.nextStep}</Text>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  logButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  emptyState: {
    paddingVertical: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  themeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  themePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.secondaryLight,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  themeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.secondaryDark,
  },
  highlight: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
    lineHeight: 20,
  },
  nextStep: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
