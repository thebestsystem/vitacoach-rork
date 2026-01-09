import { ReflectionEntry, ReflectionSummary } from "@/types/health";

type ThemeKey = "connection" | "growth" | "restoration" | "vitality" | "purpose";

type ThemeDescriptor = {
  label: string;
  keywords: string[];
  encouragement: string;
};

const THEME_MAP: Record<ThemeKey, ThemeDescriptor> = {
  connection: {
    label: "Connection",
    keywords: ["friend", "family", "team", "support", "community", "partner", "mentor"],
    encouragement: "Keep leaning into the relationships that recharge you.",
  },
  growth: {
    label: "Growth",
    keywords: ["learn", "progress", "improve", "skill", "confidence", "challenge", "stretch"],
    encouragement: "Your growth mindset is paying off—celebrate the micro-wins.",
  },
  restoration: {
    label: "Restoration",
    keywords: ["sleep", "rest", "recover", "recovery", "slow", "breathe", "calm"],
    encouragement: "Your body is asking for deliberate recovery. Protect the margin you need.",
  },
  vitality: {
    label: "Vitality",
    keywords: ["energy", "movement", "run", "walk", "power", "strong", "train", "workout"],
    encouragement: "Momentum is building—channel it into purposeful action.",
  },
  purpose: {
    label: "Purpose",
    keywords: ["impact", "mission", "purpose", "meaning", "serve", "create", "lead"],
    encouragement: "You're aligning your days with what matters most.",
  },
};

function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function detectThemes(entry: ReflectionEntry): ThemeKey[] {
  const words = [
    ...normalizeText(entry.gratitude),
    ...normalizeText(entry.challenge),
    ...normalizeText(entry.intention),
  ];

  return (Object.keys(THEME_MAP) as ThemeKey[]).filter((key) =>
    THEME_MAP[key].keywords.some((keyword) => words.includes(keyword))
  );
}

function calculateActiveStreak(entries: ReflectionEntry[]): number {
  if (entries.length === 0) {
    return 0;
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let streak = 1;
  const oneDay = 24 * 60 * 60 * 1000;

  for (let i = 1; i < sorted.length; i += 1) {
    const currentDate = new Date(sorted[i - 1].date);
    const previousDate = new Date(sorted[i].date);
    const diff = Math.round((currentDate.getTime() - previousDate.getTime()) / oneDay);

    if (diff === 1) {
      streak += 1;
    } else if (diff > 1) {
      break;
    }
  }

  const today = new Date();
  const latest = new Date(sorted[0].date);
  const diffFromToday = Math.round((today.setHours(0, 0, 0, 0) - latest.setHours(0, 0, 0, 0)) / oneDay);

  return diffFromToday > 1 ? 0 : streak;
}

function determineHighlight(summary: ReflectionSummary): string | undefined {
  if (summary.totalEntries === 0) {
    return undefined;
  }

  if (summary.topThemes.length > 0) {
    const primaryTheme = THEME_MAP[
      summary.topThemes[0].label.toLowerCase() as ThemeKey
    ];

    if (primaryTheme) {
      return primaryTheme.encouragement;
    }
  }

  if (summary.averageEnergy && summary.averageEnergy >= 4) {
    return "Your energy reflections are trending positive—lock in the habits that fuel it.";
  }

  if (summary.dominantMood === "fatigued") {
    return "You're carrying a lot. Create a buffer today before your energy dips further.";
  }

  return "Consistent reflection is sharpening your self-awareness—keep capturing the daily signal.";
}

export function summarizeReflections(reflections: ReflectionEntry[]): ReflectionSummary {
  if (!reflections || reflections.length === 0) {
    return {
      totalEntries: 0,
      activeStreak: 0,
      averageEnergy: null,
      topThemes: [],
    };
  }

  const activeStreak = calculateActiveStreak(reflections);
  const averageEnergy =
    reflections.reduce((sum, entry) => sum + entry.energyScore, 0) /
    reflections.length;

  const moodCounts = reflections.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.moodTag] = (acc[entry.moodTag] ?? 0) + 1;
    return acc;
  }, {});

  const dominantMood = (Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || undefined) as
    | ReflectionEntry["moodTag"]
    | undefined;

  const themeCounts = reflections.reduce<Record<string, number>>((acc, entry) => {
    const themes = detectThemes(entry);
    if (themes.length === 0) {
      acc.balance = (acc.balance ?? 0) + 1;
      return acc;
    }

    themes.forEach((theme) => {
      const label = THEME_MAP[theme].label;
      acc[label] = (acc[label] ?? 0) + 1;
    });
    return acc;
  }, {});

  const topThemes = Object.entries(themeCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);

  const latest = [...reflections].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  const summary: ReflectionSummary = {
    totalEntries: reflections.length,
    activeStreak,
    averageEnergy: Number(averageEnergy.toFixed(1)),
    dominantMood,
    topThemes,
    latestIntention: latest?.intention,
  };

  summary.highlight = determineHighlight(summary);

  if (latest?.intention) {
    summary.nextStep = `Tomorrow, take one small action toward “${latest.intention}.”`;
  }

  return summary;
}
