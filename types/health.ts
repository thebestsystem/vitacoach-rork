export interface UserProfile {
  name: string;
  age?: number;
  gender?: "male" | "female" | "other";
  role?: ProfessionalRole;
  height?: number;
  weight?: number;
  goals: Goal[];
  healthConditions?: string[];
  allergies?: string[];
  fitnessLevel?: "beginner" | "intermediate" | "advanced";
  dietaryPreferences?: string[];
  menstrualCycle?: MenstrualCycleData;
}

export type ProfessionalRole = "founder" | "solopreneur" | "executive" | "freelancer" | "employee" | "student";

export interface MenstrualCycleData {
  lastPeriodStart: string;
  cycleLength: number; // e.g., 28 days
  phase?: "menstrual" | "follicular" | "ovulation" | "luteal";
}

export type Goal =
  | "weight_loss"
  | "muscle_gain"
  | "mental_wellness"
  | "better_sleep"
  | "stress_management"
  | "nutrition"
  | "flexibility"
  | "endurance"
  | "boost_energy"
  | "increase_focus"
  | "prevent_burnout"
  | "optimize_performance";

export interface HealthMetrics {
  steps: number;
  heartRate?: number;
  sleep?: number;
  calories?: number;
  water?: number;
  mood?: MoodLevel;
  stress?: number;
  energy?: number;
}

export type MoodLevel = "excellent" | "good" | "okay" | "low" | "struggling";

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: "easy" | "medium" | "hard";
  exercises: Exercise[];
  createdAt: string;
}

export interface Exercise {
  name: string;
  duration?: number;
  reps?: number;
  sets?: number;
  rest?: number;
}

export interface MealPlan {
  id: string;
  title: string;
  description: string;
  meals: Meal[];
  totalCalories: number;
  createdAt: string;
}

export interface Meal {
  type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  description?: string;
}

export interface WellnessCheckIn {
  id: string;
  date: string;
  mood: MoodLevel;
  stressLevel: number;
  energyLevel: number;
  sleepQuality: number;
  notes?: string;
}

export type ReflectionMoodTag = "grounded" | "energized" | "stretched" | "fatigued" | "centered";

export interface ReflectionEntry {
  id: string;
  date: string;
  gratitude: string;
  challenge: string;
  intention: string;
  moodTag: ReflectionMoodTag;
  energyScore: number;
  clarityScore: number;
}

export interface ReflectionTheme {
  label: string;
  count: number;
}

export interface ReflectionSummary {
  totalEntries: number;
  activeStreak: number;
  averageEnergy: number | null;
  dominantMood?: ReflectionMoodTag;
  topThemes: ReflectionTheme[];
  latestIntention?: string;
  highlight?: string;
  nextStep?: string;
}

export interface MentalWellnessPlan {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: "stress_management" | "meditation" | "breathing" | "mindfulness" | "sleep_improvement";
  activities: WellnessActivity[];
  createdAt: string;
}

export interface WellnessActivity {
  name: string;
  description: string;
  duration: number;
  frequency: string;
  benefits?: string[];
}

export interface HealthInsight {
  id: string;
  type: "achievement" | "warning" | "suggestion" | "anomaly";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  actionable?: boolean;
  action?: string;
  icon?: string;
  timestamp: string;
}

export interface AnomalyDetection {
  metric: keyof HealthMetrics;
  current: number;
  expected: number;
  deviation: number;
  severity: "low" | "medium" | "high";
}

export interface HealthHistory {
  date: string;
  metrics: HealthMetrics;
}

export interface ExerciseLog {
  id: string;
  date: string;
  type: string;
  duration: number;
  calories?: number;
  intensity?: "low" | "medium" | "high";
  notes?: string;
}

export interface MealLog {
  id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  notes?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  amount: string;
  checked: boolean;
}

export type EnergyFocus = "recovery" | "balance" | "push";

export type EnergyImpact = "positive" | "neutral" | "warning";

export interface EnergyForecastDriver {
  label: string;
  impact: EnergyImpact;
  detail: string;
}

export interface EnergyForecastDay {
  date: string;
  energyScore: number;
  stressScore: number;
  focus: EnergyFocus;
  headline: string;
  anchors: string[];
  keyDrivers: EnergyForecastDriver[];
  recommendedActions: string[];
}

export type MomentumTrend = "accelerating" | "stable" | "slipping";

export interface MomentumInsight {
  metric: "steps" | "sleep" | "water" | "stress" | "mood";
  label: string;
  trend: MomentumTrend;
  change: number;
  unit: string;
  summary: string;
  action: string;
  confidence: "high" | "medium" | "low";
}

export interface Achievement {
  id: string;
  type: "steps" | "workout" | "streak" | "water" | "sleep" | "checkin" | "meal" | "milestone";
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface Streak {
  type: "workout" | "checkin" | "water" | "sleep";
  current: number;
  longest: number;
  lastDate: string;
}

export interface WeeklyGoal {
  id: string;
  type: "steps" | "workout" | "water" | "sleep" | "checkin";
  title: string;
  target: number;
  current: number;
  period: "week" | "month";
  startDate: string;
  endDate: string;
}

export interface CoachGuardrail {
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
}

export interface MicroHabitPlay {
  title: string;
  description: string;
  anchor: string;
}

export interface CoachPlaybook {
  headline: string;
  focusAreas: string[];
  guardrails: CoachGuardrail[];
  microHabits: MicroHabitPlay[];
  celebration?: string;
  readinessTag: "recharge" | "balanced" | "go_time";
  momentumScore: number;
}

export interface NotificationSettings {
  exerciseReminders: boolean;
  exerciseTime: string;
  waterReminders: boolean;
  waterInterval: number;
  mealReminders: boolean;
  mealTimes: string[];
  checkinReminders: boolean;
  checkinTime: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "steps" | "workouts" | "water" | "sleep" | "calories";
  goal: number;
  startDate: string;
  endDate: string;
  participants: ChallengeParticipant[];
  createdBy: string;
  prize?: string;
  icon: string;
}

export interface ChallengeParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  progress: number;
  joinedAt: string;
  rank?: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  rank: number;
  trend: "up" | "down" | "same";
  achievements: number;
  weeklyWorkouts: number;
}
