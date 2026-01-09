import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "@/constants/colors";
import type { WellnessCheckIn, MoodLevel } from "@/types/health";

interface MoodTrendCardProps {
  checkIns: WellnessCheckIn[];
}

const moodPalette: Record<MoodLevel, string> = {
  excellent: "#4CAF50",
  good: "#66BB6A",
  okay: "#FFC107",
  low: "#FF7043",
  struggling: "#EF5350",
};

const moodLabels: Record<MoodLevel, string> = {
  excellent: "Excellent",
  good: "Good",
  okay: "Okay",
  low: "Low",
  struggling: "Struggling",
};

const MoodTrendCard: React.FC<MoodTrendCardProps> = ({ checkIns }) => {
  const recentCheckIns = useMemo(() => {
    if (!checkIns?.length) {
      return [];
    }

    return [...checkIns]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [checkIns]);

  const averageMood = useMemo(() => {
    if (!recentCheckIns.length) return null;
    const scoreMap: Record<MoodLevel, number> = {
      excellent: 5,
      good: 4,
      okay: 3,
      low: 2,
      struggling: 1,
    };

    const total = recentCheckIns.reduce((sum, item) => sum + scoreMap[item.mood], 0);
    const average = total / recentCheckIns.length;

    if (average >= 4.5) return "Uplifted";
    if (average >= 3.5) return "Positive";
    if (average >= 2.5) return "Balancing";
    if (average >= 1.5) return "Stretched";
    return "Overloaded";
  }, [recentCheckIns]);

  if (!recentCheckIns.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mood Trend</Text>
        <Text style={styles.emptyText}>Log a wellness check-in to track your emotional rhythm.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mood Trend</Text>
        {averageMood && <Text style={styles.subtitle}>{averageMood} lately</Text>}
      </View>

      <View style={styles.timeline}>
        {recentCheckIns.map((checkIn, index) => {
          const date = new Date(checkIn.date);
          const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
          const formattedDate = `${dayName} ${date.getDate()}`;

          return (
            <View key={checkIn.id || index} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: moodPalette[checkIn.mood] }]} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineDate}>{formattedDate}</Text>
                  <Text style={[styles.timelineMood, { color: moodPalette[checkIn.mood] }]}>
                    {moodLabels[checkIn.mood]}
                  </Text>
                </View>
                <View style={styles.moodBars}>
                  {(checkIn.stressLevel !== undefined || checkIn.energyLevel !== undefined) && (
                    <Text style={styles.metricText}>
                      Stress {checkIn.stressLevel ?? "-"}/10 · Energy {checkIn.energyLevel ?? "-"}/10
                    </Text>
                  )}
                  {checkIn.notes ? <Text style={styles.noteText}>{checkIn.notes}</Text> : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default MoodTrendCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: "row" as const,
    gap: 12,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timelineMood: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  moodBars: {
    gap: 4,
  },
  metricText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  noteText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
});
