import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  UserProfile,
  HealthMetrics,
  WorkoutPlan,
  MealPlan,
  WellnessCheckIn,
  MentalWellnessPlan,
  HealthHistory,
  ExerciseLog,
  MealLog,
  Achievement,
  Streak,
  WeeklyGoal,
  NotificationSettings,
} from "@/types/health";
import {
  syncHealthDataToFirebase,
  syncGamificationDataToFirebase,
} from "@/utils/firestore";

const STORAGE_KEYS = {
  USER_PROFILE: "user_profile",
  HEALTH_METRICS: "health_metrics",
  WORKOUT_PLANS: "workout_plans",
  MEAL_PLANS: "meal_plans",
  WELLNESS_CHECKINS: "wellness_checkins",
  MENTAL_WELLNESS_PLANS: "mental_wellness_plans",
  ONBOARDING_COMPLETE: "onboarding_complete",
  HEALTH_HISTORY: "health_history",
  EXERCISE_LOGS: "exercise_logs",
  MEAL_LOGS: "meal_logs",
  ACHIEVEMENTS: "achievements",
  STREAKS: "streaks",
  WEEKLY_GOALS: "weekly_goals",
  NOTIFICATION_SETTINGS: "notification_settings",
  TOTAL_POINTS: "total_points",
  MIGRATION_COMPLETE: "migration_complete_v1",
} as const;

interface MigrationResult {
  success: boolean;
  healthDataMigrated: boolean;
  gamificationDataMigrated: boolean;
  error?: string;
}

async function loadFromAsyncStorage<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error loading ${key} from AsyncStorage:`, error);
    return null;
  }
}

export async function checkIfMigrationNeeded(): Promise<boolean> {
  try {
    const migrationComplete = await AsyncStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETE);
    if (migrationComplete === "true") {
      console.log("Migration already completed");
      return false;
    }

    const hasLocalData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!hasLocalData) {
      console.log("No local data found, migration not needed");
      await AsyncStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETE, "true");
      return false;
    }

    console.log("Migration needed");
    return true;
  } catch (error) {
    console.error("Error checking if migration needed:", error);
    return false;
  }
}

export async function migrateLocalDataToFirebase(userId: string): Promise<MigrationResult> {
  console.log("Starting migration from AsyncStorage to Firebase for user:", userId);

  try {
    const migrationComplete = await AsyncStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETE);
    if (migrationComplete === "true") {
      console.log("Migration already completed, skipping");
      return {
        success: true,
        healthDataMigrated: false,
        gamificationDataMigrated: false,
      };
    }

    let healthDataMigrated = false;
    let gamificationDataMigrated = false;

    const [
      userProfile,
      healthMetrics,
      workoutPlans,
      mealPlans,
      wellnessCheckIns,
      mentalWellnessPlans,
      healthHistory,
      exerciseLogs,
      mealLogs,
      onboardingComplete,
    ] = await Promise.all([
      loadFromAsyncStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE),
      loadFromAsyncStorage<HealthMetrics>(STORAGE_KEYS.HEALTH_METRICS),
      loadFromAsyncStorage<WorkoutPlan[]>(STORAGE_KEYS.WORKOUT_PLANS),
      loadFromAsyncStorage<MealPlan[]>(STORAGE_KEYS.MEAL_PLANS),
      loadFromAsyncStorage<WellnessCheckIn[]>(STORAGE_KEYS.WELLNESS_CHECKINS),
      loadFromAsyncStorage<MentalWellnessPlan[]>(STORAGE_KEYS.MENTAL_WELLNESS_PLANS),
      loadFromAsyncStorage<HealthHistory[]>(STORAGE_KEYS.HEALTH_HISTORY),
      loadFromAsyncStorage<ExerciseLog[]>(STORAGE_KEYS.EXERCISE_LOGS),
      loadFromAsyncStorage<MealLog[]>(STORAGE_KEYS.MEAL_LOGS),
      loadFromAsyncStorage<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETE),
    ]);

    if (healthMetrics || userProfile) {
      console.log("Migrating health data to Firebase");
      await syncHealthDataToFirebase(userId, {
        userProfile: userProfile || null,
        healthMetrics: healthMetrics || {
          steps: 0,
          heartRate: 72,
          sleep: 7,
          calories: 0,
          water: 0,
          mood: "good",
          stress: 3,
        },
        workoutPlans: workoutPlans || [],
        mealPlans: mealPlans || [],
        mentalWellnessPlans: mentalWellnessPlans || [],
        healthHistory: healthHistory || [],
        wellnessCheckIns: wellnessCheckIns || [],
        exerciseLogs: exerciseLogs || [],
        mealLogs: mealLogs || [],
        reflections: [],
        shoppingList: [],
        onboardingComplete: onboardingComplete || false,
      });
      healthDataMigrated = true;
      console.log("Health data migrated successfully");
    }

    const [achievements, streaks, weeklyGoals, notificationSettings, totalPointsStr] =
      await Promise.all([
        loadFromAsyncStorage<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS),
        loadFromAsyncStorage<Streak[]>(STORAGE_KEYS.STREAKS),
        loadFromAsyncStorage<WeeklyGoal[]>(STORAGE_KEYS.WEEKLY_GOALS),
        loadFromAsyncStorage<NotificationSettings>(STORAGE_KEYS.NOTIFICATION_SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.TOTAL_POINTS),
      ]);

    const totalPoints = totalPointsStr ? parseInt(totalPointsStr, 10) : 0;

    if (achievements || streaks || totalPoints > 0) {
      console.log("Migrating gamification data to Firebase");
      await syncGamificationDataToFirebase(userId, {
        achievements: achievements || [],
        streaks: streaks || [],
        weeklyGoals: weeklyGoals || [],
        notificationSettings: notificationSettings || {
          exerciseReminders: true,
          exerciseTime: "09:00",
          waterReminders: true,
          waterInterval: 2,
          mealReminders: true,
          mealTimes: ["08:00", "12:30", "19:00"],
          checkinReminders: true,
          checkinTime: "20:00",
        },
        totalPoints,
      });
      gamificationDataMigrated = true;
      console.log("Gamification data migrated successfully");
    }

    await AsyncStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETE, "true");
    console.log("Migration completed successfully");

    return {
      success: true,
      healthDataMigrated,
      gamificationDataMigrated,
    };
  } catch (error) {
    console.error("Error during migration:", error);
    return {
      success: false,
      healthDataMigrated: false,
      gamificationDataMigrated: false,
      error: error instanceof Error ? error.message : "Unknown error during migration",
    };
  }
}

export async function clearLocalStorageAfterMigration(): Promise<void> {
  console.log("Clearing local AsyncStorage after migration");
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.HEALTH_METRICS,
      STORAGE_KEYS.WORKOUT_PLANS,
      STORAGE_KEYS.MEAL_PLANS,
      STORAGE_KEYS.WELLNESS_CHECKINS,
      STORAGE_KEYS.MENTAL_WELLNESS_PLANS,
      STORAGE_KEYS.HEALTH_HISTORY,
      STORAGE_KEYS.EXERCISE_LOGS,
      STORAGE_KEYS.MEAL_LOGS,
      STORAGE_KEYS.ONBOARDING_COMPLETE,
      STORAGE_KEYS.ACHIEVEMENTS,
      STORAGE_KEYS.STREAKS,
      STORAGE_KEYS.WEEKLY_GOALS,
      STORAGE_KEYS.NOTIFICATION_SETTINGS,
      STORAGE_KEYS.TOTAL_POINTS,
    ]);
    console.log("Local storage cleared successfully");
  } catch (error) {
    console.error("Error clearing local storage:", error);
  }
}
