import type {
  CoachPlaybook,
  HealthHistory,
  HealthMetrics,
  WellnessCheckIn,
  ReflectionEntry,
  EnergyForecastDay,
  CoachGuardrail,
  MicroHabitPlay,
} from "@/types/health";

type CoachPlaybookInput = {
  current: HealthMetrics | null;
  history: HealthHistory[];
  checkIns: WellnessCheckIn[];
  reflections: ReflectionEntry[];
  energyForecast: EnergyForecastDay[];
};

function averageMetric(history: HealthHistory[], key: keyof HealthMetrics, days = 7): number | null {
  if (!history || history.length === 0) {
    return null;
  }

  const sorted = [...history]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, days);

  const values = sorted
    .map((entry) => entry.metrics[key])
    .filter((value): value is number => typeof value === "number" && !Number.isNaN(value));

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeTrend(history: HealthHistory[], key: keyof HealthMetrics): number | null {
  if (!history || history.length < 4) {
    return null;
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const recent = sorted.slice(0, 3);
  const previous = sorted.slice(3, 6);

  const avgRecent = recent
    .map((entry) => entry.metrics[key])
    .filter((value): value is number => typeof value === "number")
    .reduce((sum, value, _, arr) => sum + value / arr.length, 0);

  const avgPrevious = previous
    .map((entry) => entry.metrics[key])
    .filter((value): value is number => typeof value === "number")
    .reduce((sum, value, _, arr) => sum + value / arr.length, 0);

  if (!Number.isFinite(avgRecent) || !Number.isFinite(avgPrevious) || avgPrevious === 0) {
    return null;
  }

  return ((avgRecent - avgPrevious) / avgPrevious) * 100;
}

function buildGuardrails(input: CoachPlaybookInput): CoachGuardrail[] {
  const guardrails: CoachGuardrail[] = [];
  const { current, history, checkIns } = input;

  const sleepAverage = averageMetric(history, "sleep");
  if ((current?.sleep ?? sleepAverage ?? 0) < 6.5) {
    guardrails.push({
      title: "Protect your sleep window",
      description:
        "Wind-down rituals need an upgrade. Block a non-negotiable 30-minute buffer before lights out tonight.",
      severity: "warning",
    });
  }

  const stressRecent = checkIns
    .slice(-3)
    .map((entry) => entry.stressLevel)
    .filter((value) => typeof value === "number");
  if (stressRecent.length >= 2 && stressRecent.every((value) => value >= 7)) {
    guardrails.push({
      title: "Stress is stacking",
      description:
        "Schedule a 15-minute decompression break mid-day and bookend it with three slow breaths—no multitasking.",
      severity: "critical",
    });
  }

  const hydrationTrend = computeTrend(history, "water");
  if (hydrationTrend !== null && hydrationTrend < -10) {
    guardrails.push({
      title: "Hydration dip detected",
      description: "Your water intake slipped this week. Prime a water bottle at night and anchor sips to every context switch.",
      severity: "info",
    });
  }

  return guardrails;
}

function buildMicroHabits(input: CoachPlaybookInput): MicroHabitPlay[] {
  const microHabits: MicroHabitPlay[] = [];
  const { current, reflections } = input;
  const forecastDays = input.energyForecast ?? [];

  if ((current?.steps ?? 0) < 8000) {
    microHabits.push({
      title: "Movement micro-break",
      description: "Stack a 5-minute mobility walk after your longest seated block to keep blood flow high.",
      anchor: "Right after your heaviest focus session",
    });
  }

  if (reflections.some((entry) => entry.moodTag === "fatigued")) {
    microHabits.push({
      title: "Energy top-up",
      description: "Try a 90-second breath ladder (inhale 4, hold 4, exhale 6) whenever energy feels jagged.",
      anchor: "Set a reminder for the afternoon slump",
    });
  }

  const highEnergyDay = forecastDays.find((day) => day.energyScore >= 7);
  if (highEnergyDay) {
    microHabits.push({
      title: "Go big on your best day",
      description: "Use your highest energy window to schedule the workout or habit that moves the needle most.",
      anchor: `Plan it on ${new Date(highEnergyDay.date).toLocaleDateString(undefined, {
        weekday: "long",
      })}`,
    });
  }

  if (microHabits.length === 0) {
    microHabits.push({
      title: "Anchor your wins",
      description: "Capture one sentence about what worked well today to reinforce the habit loop.",
      anchor: "Just before you log your reflection",
    });
  }

  return microHabits.slice(0, 3);
}

function determineReadiness(current: HealthMetrics | null, reflections: ReflectionEntry[]): CoachPlaybook["readinessTag"] {
  const fatigueSignals = reflections.filter((entry) => entry.moodTag === "fatigued").length;
  if (fatigueSignals >= 2) {
    return "recharge";
  }

  if ((current?.sleep ?? 7) >= 7.5 && (current?.water ?? 0) >= 2.5) {
    return "go_time";
  }

  return "balanced";
}

export function generateCoachPlaybook(input: CoachPlaybookInput): CoachPlaybook {
  const { current, history, reflections, energyForecast } = input;

  const guardrails = buildGuardrails(input);
  const microHabits = buildMicroHabits(input);
  const readinessTag = determineReadiness(current, reflections);

  const momentumScoreRaw = [
    computeTrend(history, "steps") ?? 0,
    computeTrend(history, "sleep") ?? 0,
    computeTrend(history, "water") ?? 0,
  ].reduce((sum, value) => sum + value, 0);
  const momentumScore = Math.max(-30, Math.min(30, Math.round(momentumScoreRaw / 3)));

  const focusAreas: string[] = [];
  if ((current?.stress ?? 0) >= 7) {
    focusAreas.push("Nervous system reset");
  }
  if ((current?.sleep ?? 0) < 7) {
    focusAreas.push("Evening wind-down upgrade");
  }
  if ((current?.water ?? 0) < 2) {
    focusAreas.push("Hydration priming");
  }
  if (focusAreas.length === 0) {
    focusAreas.push("Keep amplifying what works");
  }

  const celebration = reflections.length
    ? `You captured ${reflections.length} reflections—self-awareness is becoming a real moat.`
    : undefined;

  const headline = readinessTag === "go_time"
    ? "You're primed—let's convert momentum into measurable wins."
    : readinessTag === "recharge"
      ? "Your system is flagging. Today is about strategic recovery."
      : "Solid base. We'll double-down on rhythm and consistency.";

  return {
    headline,
    focusAreas,
    guardrails,
    microHabits,
    celebration,
    readinessTag,
    momentumScore,
  };
}
