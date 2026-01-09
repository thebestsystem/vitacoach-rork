import { Shield, Moon, Sparkles, BatteryCharging, Footprints } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "@/constants/colors";
import type { ResilienceProfile, ResilienceDriver } from "@/utils/resilience";

interface ResilienceCompassCardProps {
  profile: ResilienceProfile | null;
}

const statusCopy: Record<ResilienceProfile["status"], { label: string; tone: string }> = {
  thriving: { label: "Thriving", tone: "#2ecc71" },
  stable: { label: "Stable", tone: colors.primary },
  vulnerable: { label: "Buffer Needed", tone: colors.warning },
};

const trendCopy: Record<ResilienceProfile["trend"], string> = {
  climbing: "Momentum rising",
  steady: "Holding steady",
  cooling: "Energy dipping",
};

const driverIcon = (driver: ResilienceDriver) => {
  switch (driver.key) {
    case "sleep":
      return <Moon size={18} color={colors.primaryLight} strokeWidth={2.5} />;
    case "stress":
      return <Shield size={18} color={colors.accent} strokeWidth={2.5} />;
    case "mood":
      return <Sparkles size={18} color={colors.secondary} strokeWidth={2.5} />;
    case "energy":
      return <BatteryCharging size={18} color={colors.warning} strokeWidth={2.5} />;
    case "consistency":
    default:
      return <Footprints size={18} color={colors.primary} strokeWidth={2.5} />;
  }
};

const importanceBadge: Record<ResilienceDriver["importance"], string> = {
  high: "Core",
  medium: "Key",
  supporting: "Support",
};

export default function ResilienceCompassCard({ profile }: ResilienceCompassCardProps) {
  if (!profile) {
    return (
      <View style={[styles.card, styles.emptyState]}>
        <Text style={styles.emptyTitle}>Resilience compass warming up</Text>
        <Text style={styles.emptyBody}>
          Log a wellness check-in and daily stats to unlock personalized resilience insights.
        </Text>
      </View>
    );
  }

  const status = statusCopy[profile.status];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Resilience Compass</Text>
          <Text style={styles.trendText}>{trendCopy[profile.trend]}</Text>
        </View>
        <View style={[styles.scoreBadge, { borderColor: status.tone }]}>
          <Text style={[styles.scoreValue, { color: status.tone }]}>{profile.score}</Text>
          <Text style={[styles.scoreLabel, { color: status.tone }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.summary}>{profile.summary}</Text>

      <View style={styles.divider} />

      <View style={styles.driversGrid}>
        {profile.drivers.map((driver) => {
          const deltaSymbol = driver.change > 0 ? "▲" : driver.change < 0 ? "▼" : "•";
          const deltaColor =
            driver.change > 0.1 ? colors.success : driver.change < -0.1 ? colors.warning : colors.textSecondary;

          return (
            <View key={driver.key} style={styles.driverCard}>
              <View style={styles.driverHeader}>
                <View style={styles.driverIcon}>{driverIcon(driver)}</View>
                <View>
                  <Text style={styles.driverLabel}>{driver.label}</Text>
                  <Text style={styles.driverMeta}>{importanceBadge[driver.importance]} focus</Text>
                </View>
              </View>
              <View style={styles.driverScoreRow}>
                <Text style={styles.driverScore}>{driver.score}</Text>
                <Text style={[styles.driverDelta, { color: deltaColor }]}>
                  {deltaSymbol} {Math.abs(driver.change).toFixed(driver.change === 0 ? 0 : 1)}
                </Text>
              </View>
              <Text style={styles.driverNarrative}>{driver.narrative}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.recoContainer}>
        <Text style={styles.recoTitle}>What to reinforce today</Text>
        {profile.recommendations.map((tip, index) => (
          <View key={tip} style={styles.recoRow}>
            <Text style={styles.recoBullet}>{index + 1}.</Text>
            <Text style={styles.recoText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  trendText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  scoreBadge: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summary: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 16,
  },
  driversGrid: {
    gap: 14,
  },
  driverCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 16,
  },
  driverHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  driverIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  driverLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  driverMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 2,
  },
  driverScoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  driverScore: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  driverDelta: {
    fontSize: 12,
    fontWeight: "600",
  },
  driverNarrative: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  recoContainer: {
    marginTop: 18,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
  },
  recoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  recoRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  recoBullet: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  recoText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    flex: 1,
  },
});
