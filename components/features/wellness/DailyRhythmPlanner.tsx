import { Sunrise, Sun, Sunset, Coffee, Activity, StretchHorizontal, HeartPulse, NotebookPen } from "lucide-react-native";
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "@/constants/colors";
import type {
  EnergyForecastDay,
  HealthMetrics,
  MealPlan,
  MentalWellnessPlan,
  WellnessCheckIn,
  WorkoutPlan,
} from "@/types/health";
import type { ResilienceProfile } from "@/utils/resilience";

interface DailyRhythmPlannerProps {
  metrics: HealthMetrics | null;
  energyForecast: EnergyForecastDay[];
  workoutPlans: WorkoutPlan[];
  mentalWellnessPlans: MentalWellnessPlan[];
  mealPlans: MealPlan[];
  checkIns: WellnessCheckIn[];
  resilience: ResilienceProfile | null;
}

interface RhythmBlock {
  id: string;
  icon: React.ReactNode;
  label: string;
  window: string;
  summary: string;
  highlights: string[];
}

const focusCopy: Record<string, { label: string; description: string; tone: string }> = {
  restore: {
    label: "Restore",
    description: "Protect recovery, calm the nervous system, and refill energy reserves.",
    tone: colors.accent,
  },
  balance: {
    label: "Balance",
    description: "Blend steady training, nourishing meals, and mindful resets.",
    tone: colors.primary,
  },
  ignite: {
    label: "Ignite",
    description: "Lean into momentum with purposeful pushes and strategic recovery.",
    tone: colors.secondary,
  },
};

const selectFocusMode = (
  energyForecast: EnergyForecastDay[],
  resilience: ResilienceProfile | null,
): "restore" | "balance" | "ignite" => {
  const today = energyForecast[0];
  if (today?.focus === "recovery" || resilience?.status === "vulnerable" || resilience?.trend === "cooling") {
    return "restore";
  }
  if (today?.focus === "push" || resilience?.status === "thriving") {
    return "ignite";
  }
  return "balance";
};

const buildHighlights = (items: (string | undefined)[]) => items.filter(Boolean) as string[];

export default function DailyRhythmPlanner({
  metrics,
  energyForecast,
  workoutPlans,
  mentalWellnessPlans,
  mealPlans,
  checkIns,
  resilience,
}: DailyRhythmPlannerProps) {
  const latestCheckIn = useMemo(() => {
    return [...checkIns]
      .sort((a, b) => (a.date > b.date ? -1 : 1))
      .shift();
  }, [checkIns]);

  const focusMode = useMemo(() => selectFocusMode(energyForecast, resilience), [energyForecast, resilience]);
  const focusMeta = focusCopy[focusMode];

  const primaryWorkout = workoutPlans[0];
  const mentalPlan = mentalWellnessPlans[0];
  const mealPlan = mealPlans[0];

  const derivedSleep = (() => {
    if (typeof metrics?.sleep === "number") {
      return metrics.sleep;
    }
    if (typeof latestCheckIn?.sleepQuality === "number") {
      return (latestCheckIn.sleepQuality / 10) * 8;
    }
    return undefined;
  })();

  const hydrationLiters = metrics?.water;

  const blocks = useMemo<RhythmBlock[]>(() => {
    const sleepNeed = derivedSleep !== undefined && derivedSleep < 7;
    const hydrationLow = hydrationLiters !== undefined && hydrationLiters < 2;

    const morningHighlights = buildHighlights([
      focusMode === "ignite"
        ? `Prime with ${primaryWorkout?.title ?? "a mobility activation"} — keep intensity crisp`:
        focusMode === "restore"
        ? "Start gentle: 6-minute breathwork + mobility flow"
        : `Open with sunlight walk and gratitude jot (${mentalPlan?.title ?? "mindful primer"})`,
      sleepNeed ? "Extend wake-up buffer: aim for a 20-minute slower start" : undefined,
      hydrationLow ? "Drink 500ml water within 20 minutes of waking" : "Layer minerals into your first hydration",
    ]);

    const middayHighlights = buildHighlights([
      focusMode === "restore"
        ? "Protect a decompress break after lunch—box breathing or journaling"
        : focusMode === "ignite"
        ? `High-output block: 45-60 minutes deep work then ${mentalPlan?.title ?? "reset session"}`
        : "Alternate 50 minutes focus / 10 minutes movement to sustain energy",
      primaryWorkout ? `Stack ${primaryWorkout.title} ${focusMode === "ignite" ? "this afternoon" : "when energy peaks"}` : undefined,
      mealPlan ? `Fuel with ${mealPlan.title} highlights—balance protein + colors` : undefined,
    ]);

    const eveningHighlights = buildHighlights([
      focusMode === "ignite"
        ? "Downshift 90 minutes pre-bed—light stretch & blue-light dimming"
        : "Wind-down ritual: warm shower, parasympathetic breathing, low lights",
      mentalPlan ? `Close day with ${mentalPlan.title.split(" ")[0]} reflection` : "Capture 3 wins in journal",
      sleepNeed ? "Be in bed 20 minutes earlier than usual tonight" : undefined,
    ]);

    return [
      {
        id: "morning",
        icon: <Sunrise size={20} color={focusMeta.tone} strokeWidth={2.5} />,
        label: "Morning Reset",
        window: "Before 9 AM",
        summary:
          focusMode === "restore"
            ? "Ease awake and rebuild nervous system safety."
            : focusMode === "ignite"
            ? "Own the first hour with purposeful activation."
            : "Create a centered launch that anchors the day.",
        highlights: morningHighlights,
      },
      {
        id: "midday",
        icon: <Sun size={20} color={focusMeta.tone} strokeWidth={2.5} />,
        label: "Midday Momentum",
        window: "11 AM - 4 PM",
        summary:
          focusMode === "restore"
            ? "Guard energy dips with recovery-first scheduling."
            : focusMode === "ignite"
            ? "Use peak energy to move the mission forward."
            : "Balance focused work, nourishment, and movement.",
        highlights: middayHighlights,
      },
      {
        id: "evening",
        icon: <Sunset size={20} color={focusMeta.tone} strokeWidth={2.5} />,
        label: "Evening Wind-down",
        window: "After 7 PM",
        summary:
          focusMode === "restore"
            ? "Soothe the system and signal deep sleep." : "Close loops and set tomorrow up with intention.",
        highlights: eveningHighlights,
      },
    ];
  }, [
    focusMode,
    focusMeta.tone,
    primaryWorkout?.title,
    mentalPlan?.title,
    mealPlan?.title,
    derivedSleep,
    hydrationLiters,
  ]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Daily Rhythm Planner</Text>
          <Text style={styles.subtitle}>{focusMeta.description}</Text>
        </View>
        <View style={[styles.focusPill, { borderColor: focusMeta.tone }]}> 
          <Text style={[styles.focusLabel, { color: focusMeta.tone }]}>{focusMeta.label}</Text>
        </View>
      </View>

      <View style={styles.blocksContainer}>
        {blocks.map((block) => (
          <View key={block.id} style={styles.block}>
            <View style={styles.blockHeader}>
              <View style={styles.blockIcon}>{block.icon}</View>
              <View>
                <Text style={styles.blockLabel}>{block.label}</Text>
                <Text style={styles.blockWindow}>{block.window}</Text>
              </View>
            </View>
            <Text style={styles.blockSummary}>{block.summary}</Text>
            <View style={styles.highlightList}>
              {block.highlights.map((highlight) => (
                <View key={highlight} style={styles.highlightRow}>
                  <View style={[styles.bullet, { backgroundColor: focusMeta.tone }]} />
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Coffee size={18} color={colors.textSecondary} strokeWidth={2.5} />
          <Text style={styles.metaText}>
            Wake-up buffer {derivedSleep ? `${derivedSleep >= 7 ? "on track" : "needs +20m"}` : "set"}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Activity size={18} color={colors.textSecondary} strokeWidth={2.5} />
          <Text style={styles.metaText}>
            Steps goal anchor {metrics?.steps ? `${Math.round(metrics.steps / 1000)}k logged` : "plan a walk"}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <StretchHorizontal size={18} color={colors.textSecondary} strokeWidth={2.5} />
          <Text style={styles.metaText}>
            Micro-break cadence {mentalPlan ? "guided" : "add 2 timers"}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <HeartPulse size={18} color={colors.textSecondary} strokeWidth={2.5} />
          <Text style={styles.metaText}>
            Nervous system {resilience?.status === "thriving" ? "adaptable" : resilience?.status === "stable" ? "steady" : "sensitive"}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <NotebookPen size={18} color={colors.textSecondary} strokeWidth={2.5} />
          <Text style={styles.metaText}>
            Evening reflection {latestCheckIn ? "logged" : "schedule"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  focusPill: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  focusLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  blocksContainer: {
    gap: 16,
  },
  block: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 18,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  blockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  blockLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  blockWindow: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 2,
  },
  blockSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  highlightList: {
    gap: 10,
  },
  highlightRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  metaRow: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "48%",
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
