import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import { Wind, Coffee, Sun, Sparkles, Moon } from "lucide-react-native";
import colors from "@/constants/colors";
import type { HealthMetrics, WellnessCheckIn } from "@/types/health";
import { selectionFeedback } from "@/utils/haptics";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MindfulBreakPlannerProps {
  metrics: HealthMetrics | null;
  lastCheckIns: WellnessCheckIn[];
}

type BreakRecommendation = {
  icon: React.ReactNode;
  title: string;
  message: string;
  guide: string[];
};

const BREATHING_GUIDE = [
  "Inhale slowly through your nose for 4 counts",
  "Hold the breath gently for 4 counts",
  "Exhale softly through your mouth for 4 counts",
  "Pause briefly and repeat for 3 rounds",
];

const STRETCH_GUIDE = [
  "Roll your shoulders back and down",
  "Reach arms overhead and stretch tall",
  "Twist gently to each side while seated",
  "Stand up, shake out tension, and smile",
];

const GRATITUDE_GUIDE = [
  "Place a hand on your heart",
  "Think of one win from today",
  "Appreciate someone who supported you",
  "Set a kind intention for the next hour",
];

const MindfulBreakPlanner: React.FC<MindfulBreakPlannerProps> = ({ metrics, lastCheckIns }) => {
  const [expandedGuide, setExpandedGuide] = useState<BreakRecommendation | null>(null);

  const lastCheckInDate = useMemo(() => {
    if (!lastCheckIns.length) {
      return null;
    }
    const sorted = [...lastCheckIns].sort((a, b) => (a.date < b.date ? 1 : -1));
    return sorted[0].date;
  }, [lastCheckIns]);

  const hoursSinceCheckIn = useMemo(() => {
    if (!lastCheckInDate) {
      return Infinity;
    }
    const last = new Date(lastCheckInDate);
    const diffMs = Date.now() - last.getTime();
    return diffMs / (1000 * 60 * 60);
  }, [lastCheckInDate]);

  const recommendation = useMemo<BreakRecommendation>(() => {
    const stressLevel = metrics?.stress ?? 0;
    const energy = metrics?.calories ? Math.min(metrics.calories / 250, 10) : 0;
    const sleepQuality = metrics?.sleep ?? 0;

    if (stressLevel >= 7) {
      return {
        icon: <Wind size={20} color={colors.surface} strokeWidth={2.2} />,
        title: "Take a calming breath",
        message: "Stress is elevated—3 minutes of box breathing resets your nervous system.",
        guide: BREATHING_GUIDE,
      };
    }

    if (sleepQuality < 6) {
      return {
        icon: <Moon size={20} color={colors.surface} strokeWidth={2.2} />,
        title: "Reset with mindful rest",
        message: "Short restorative pauses keep your energy steady after limited sleep.",
        guide: GRATITUDE_GUIDE,
      };
    }

    if (hoursSinceCheckIn > 18) {
      return {
        icon: <Sparkles size={20} color={colors.surface} strokeWidth={2.2} />,
        title: "Quick emotional reset",
        message: "It’s been a while since your last check-in—reflect to stay grounded.",
        guide: GRATITUDE_GUIDE,
      };
    }

    if ((metrics?.steps ?? 0) < 4000 || energy < 4) {
      return {
        icon: <Sun size={20} color={colors.surface} strokeWidth={2.2} />,
        title: "Move and refresh",
        message: "Light movement unlocks energy—take a posture break with gentle stretching.",
        guide: STRETCH_GUIDE,
      };
    }

    return {
      icon: <Coffee size={20} color={colors.surface} strokeWidth={2.2} />,
      title: "Micro-boost",
      message: "You’re on track. A mindful sip of water and a deep breath keep momentum strong.",
      guide: BREATHING_GUIDE,
    };
  }, [hoursSinceCheckIn, metrics?.calories, metrics?.sleep, metrics?.steps, metrics?.stress]);

  const toggleGuide = () => {
    selectionFeedback();
    if (Platform.OS === "ios" || Platform.OS === "android") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedGuide((current) => (current ? null : recommendation));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>{recommendation.icon}</View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{recommendation.title}</Text>
          <Text style={styles.subtitle}>{recommendation.message}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Stress</Text>
          <Text style={styles.metaValue}>{metrics?.stress ? `${metrics.stress}/10` : "--"}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Last check-in</Text>
          <Text style={styles.metaValue}>{Number.isFinite(hoursSinceCheckIn) ? `${Math.round(hoursSinceCheckIn)}h ago` : "No data"}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.guideButton} onPress={toggleGuide} activeOpacity={0.9}>
        <Text style={styles.guideButtonText}>{expandedGuide ? "Hide guidance" : "Show 3-minute guide"}</Text>
      </TouchableOpacity>

      {expandedGuide && (
        <View style={styles.guideContainer}>
          {expandedGuide.guide.map((step, index) => (
            <View key={step} style={styles.guideStep}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default MindfulBreakPlanner;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    overflow: "hidden" as const,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 16,
    marginBottom: 16,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + "33",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.surface,
    marginBottom: 6,
  },
  subtitle: {
    color: colors.surface,
    opacity: 0.85,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: colors.primary + "26",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    color: colors.surface,
    opacity: 0.7,
    fontSize: 12,
    marginBottom: 4,
  },
  metaValue: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  metaDivider: {
    width: 1,
    height: "100%",
    backgroundColor: colors.surface + "33",
    marginHorizontal: 12,
  },
  guideButton: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center" as const,
  },
  guideButtonText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  guideContainer: {
    marginTop: 18,
    gap: 12,
  },
  guideStep: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  stepBadgeText: {
    color: colors.primaryDark,
    fontWeight: "700" as const,
  },
  stepText: {
    flex: 1,
    color: colors.surface,
    opacity: 0.92,
    fontSize: 14,
    lineHeight: 20,
  },
});
