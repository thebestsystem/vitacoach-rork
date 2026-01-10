import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import type {
  UserProfile,
  HealthMetrics,
  WorkoutPlan,
  MealPlan,
  WellnessCheckIn,
  MentalWellnessPlan,
  HealthHistory,
  HealthInsight,
  ExerciseLog,
  MealLog,
  ReflectionEntry,
  ShoppingItem,
} from "@/types/health";
import { useAuth } from "./AuthContext";
import { useSubscription } from "./SubscriptionContext";
import { useGamification } from "./GamificationContext";
import { checkQuota, incrementQuota } from "@/utils/quotas";
import { QuotaExceededError } from "@/utils/errors";
import {
  syncHealthDataToFirebase,
  loadHealthDataFromFirebase,
  syncPartialHealthData,
} from "@/utils/firestore";
import { generateInsights } from "@/utils/healthAnalyzer";
import { generateEnergyForecast } from "@/utils/energyForecast";
import { generateMomentumInsights } from "@/utils/momentum";
import { handleFirebaseError, type UserFriendlyError } from "@/utils/firebaseErrors";
import { logger } from "@/utils/logger";
import { summarizeReflections } from "@/utils/reflectionInsights";
import { generateCoachPlaybook } from "@/utils/coachPlaybook";
import { healthSyncService } from "@/utils/healthSync";
import { useShoppingStore } from "@/stores/shoppingStore";

export const [HealthProvider, useHealth] = createContextHook(() => {
  const { user } = useAuth();
  const { currentPlan } = useSubscription();
  const gamification = useGamification();
  const queryClient = useQueryClient();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [wellnessCheckIns, setWellnessCheckIns] = useState<WellnessCheckIn[]>([]);
  const [mentalWellnessPlans, setMentalWellnessPlans] = useState<MentalWellnessPlan[]>([]);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [healthHistory, setHealthHistory] = useState<HealthHistory[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [syncError, setSyncError] = useState<UserFriendlyError | null>(null);
  const [retryCount] = useState<number>(0);

  const { setShoppingList } = useShoppingStore();

  // Auto-sync health data on mount and app foreground
  useEffect(() => {
    const syncNativeHealth = async () => {
      try {
        const metrics = await healthSyncService.getDailyMetrics();
        if (metrics.steps > 0 || metrics.calories > 0) {
          // Merge with existing or set new
          setHealthMetrics((prev) => {
            if (!prev) return { steps: metrics.steps, water: 0, calories: metrics.calories, sleep: metrics.sleep / 60 };
            return {
              ...prev,
              steps: Math.max(prev.steps ?? 0, metrics.steps),
              calories: Math.max(prev.calories ?? 0, metrics.calories),
              sleep: metrics.sleep > 0 ? metrics.sleep / 60 : prev.sleep,
            };
          });
        }
      } catch (e) {
        console.warn("Native Health Sync failed", e);
      }
    };

    // Initial sync
    syncNativeHealth();

    // App state listener
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        syncNativeHealth();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const healthDataQuery = useQuery({
    queryKey: ["healthData", user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        return null;
      }
      try {
        const data = await loadHealthDataFromFirebase(user.uid);
        logger.info('Health data loaded successfully', 'HealthContext', { userId: user.uid });
        return data;
      } catch (error) {
        handleFirebaseError(error, 'loadHealthData', { userId: user.uid });
        throw error;
      }
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  useEffect(() => {
    if (healthDataQuery.data) {
      // console.log("Loading health data from Firebase", healthDataQuery.data);
      setUserProfile(healthDataQuery.data.userProfile);
      setHealthMetrics(healthDataQuery.data.healthMetrics);
      setWorkoutPlans(healthDataQuery.data.workoutPlans);
      setMealPlans(healthDataQuery.data.mealPlans);
      setWellnessCheckIns(healthDataQuery.data.wellnessCheckIns);
      setMentalWellnessPlans(healthDataQuery.data.mentalWellnessPlans);
      setOnboardingComplete(healthDataQuery.data.onboardingComplete);
      setHealthHistory(healthDataQuery.data.healthHistory);
      setExerciseLogs(healthDataQuery.data.exerciseLogs);
      setMealLogs(healthDataQuery.data.mealLogs);
      setReflections(healthDataQuery.data.reflections ?? []);
      setShoppingList(healthDataQuery.data.shoppingList ?? []);
    } else if (healthDataQuery.isFetched && !healthDataQuery.data && user?.uid && !healthDataQuery.isError) {
      // console.log("No health data found, initializing defaults");
      const initDefaults = async () => {
        try {
          await syncHealthDataToFirebase(user.uid, {
            userProfile: null,
            healthMetrics: { steps: 0 },
            workoutPlans: [],
            mealPlans: [],
            wellnessCheckIns: [],
            mentalWellnessPlans: [],
            onboardingComplete: false,
            healthHistory: [],
            exerciseLogs: [],
            mealLogs: [],
            reflections: [],
            shoppingList: [],
          });
          setHealthMetrics({ steps: 0 });
          setOnboardingComplete(false);
          setReflections([]);
          setShoppingList([]);
        } catch (error) {
          const friendlyError = handleFirebaseError(error, 'initializeDefaults', { userId: user.uid });
          setSyncError(friendlyError);
        }
      };
      initDefaults();
    }
  }, [healthDataQuery.data, healthDataQuery.isFetched, healthDataQuery.isError, user?.uid]);





  const insights = useMemo<HealthInsight[]>(() => {
    if (!healthHistory || healthHistory.length === 0 || !healthMetrics || !userProfile) {
      return [];
    }

    return generateInsights({
      currentMetrics: healthMetrics,
      history: healthHistory,
      checkIns: wellnessCheckIns,
      userProfile,
    });
  }, [healthHistory, healthMetrics, userProfile, wellnessCheckIns]);

  const energyForecast = useMemo(
    () =>
      generateEnergyForecast({
        history: healthHistory,
        checkIns: wellnessCheckIns,
        current: healthMetrics,
      }),
    [healthHistory, wellnessCheckIns, healthMetrics]
  );

  const momentumInsights = useMemo(
    () =>
      generateMomentumInsights({
        history: healthHistory,
        checkIns: wellnessCheckIns,
      }),
    [healthHistory, wellnessCheckIns]
  );

  const reflectionSummary = useMemo(
    () => summarizeReflections(reflections),
    [reflections]
  );

  const coachPlaybook = useMemo(
    () =>
      generateCoachPlaybook({
        current: healthMetrics,
        history: healthHistory,
        checkIns: wellnessCheckIns,
        reflections,
        energyForecast,
      }),
    [healthMetrics, healthHistory, wellnessCheckIns, reflections, energyForecast]
  );

  const refreshAll = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ["healthData", user?.uid] });
  }, [queryClient, user?.uid]);

  const saveProfile = useCallback(
    async (profile: UserProfile) => {
      setUserProfile(profile);

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, {
            userProfile: profile,
          });
        } catch (error) {
          const friendlyError = handleFirebaseError(error, 'saveProfile', { userId: user.uid });
          setSyncError(friendlyError);
          throw error;
        }
      }
    },
    [user?.uid]
  );

  const completeOnboarding = useCallback(
    async (profile: UserProfile) => {
      setUserProfile(profile);
      setOnboardingComplete(true);

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, {
            userProfile: profile,
            onboardingComplete: true,
          });
        } catch (error) {
          const friendlyError = handleFirebaseError(error, 'completeOnboarding', { userId: user.uid });
          setSyncError(friendlyError);
          throw error;
        }
      }
    },
    [user?.uid]
  );

  const updateMetrics = useCallback(
    async (metrics: HealthMetrics) => {
      setHealthMetrics(metrics);

      const today = new Date().toISOString().split("T")[0];
      const historyEntry: HealthHistory = {
        date: today,
        metrics,
      };

      const updatedHistory = [
        ...healthHistory.filter((h) => h.date !== today),
        historyEntry,
      ];
      setHealthHistory(updatedHistory);

      if (gamification) {
        if (metrics.steps) {
          gamification.checkAchievement("first_step", metrics.steps);
          gamification.checkAchievement("walker", metrics.steps);
          gamification.checkAchievement("marathon", metrics.steps);
        }
      }

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, {
            healthMetrics: metrics,
            healthHistory: updatedHistory,
          });
        } catch (error) {
          const friendlyError = handleFirebaseError(error, 'updateMetrics', { userId: user.uid });
          setSyncError(friendlyError);
          throw error;
        }
      }
    },
    [
      gamification,
      healthHistory,
      user?.uid,
    ]
  );

  const logWaterIntake = useCallback(
    async (amount: number) => {
      const currentMetrics: HealthMetrics = {
        steps: healthMetrics?.steps ?? 0,
        ...healthMetrics,
      };

      const updatedMetrics: HealthMetrics = {
        ...currentMetrics,
        water: parseFloat(((currentMetrics.water ?? 0) + amount).toFixed(2)),
      };

      await updateMetrics(updatedMetrics);
    },
    [healthMetrics, updateMetrics]
  );

  const addWorkoutPlan = useCallback(
    async (plan: WorkoutPlan) => {
      if (user?.uid) {
        const { allowed, limit } = await checkQuota(user.uid, currentPlan, "workoutPlansThisMonth");
        if (!allowed) {
          throw new QuotaExceededError(limit, "workoutPlansThisMonth");
        }
      }

      const updated = [...workoutPlans, plan];
      setWorkoutPlans(updated);

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, {
            workoutPlans: updated,
          });
          await incrementQuota(user.uid, "workoutPlansThisMonth");
        } catch (error) {
          const friendlyError = handleFirebaseError(error, 'addWorkoutPlan', { userId: user.uid });
          setSyncError(friendlyError);
          throw error;
        }
      }
    },
    [
      workoutPlans,
      user?.uid,
      currentPlan,
    ]
  );

  const addMealPlan = useCallback(
    async (plan: MealPlan) => {
      if (user?.uid) {
        const { allowed, limit } = await checkQuota(user.uid, currentPlan, "mealPlansThisMonth");
        if (!allowed) {
          throw new QuotaExceededError(limit, "mealPlansThisMonth");
        }
      }

      const updated = [...mealPlans, plan];
      setMealPlans(updated);

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, {
            mealPlans: updated,
          });
          await incrementQuota(user.uid, "mealPlansThisMonth");
        } catch (error) {
          const friendlyError = handleFirebaseError(error, 'addMealPlan', { userId: user.uid });
          setSyncError(friendlyError);
          throw error;
        }
      }
    },
    [
      mealPlans,
      user?.uid,
      currentPlan,
    ]
  );

  const addWellnessCheckIn = useCallback(
    async (checkIn: WellnessCheckIn) => {
      if (user?.uid) {
        const { allowed, limit } = await checkQuota(user.uid, currentPlan, "wellnessCheckInsToday");
        if (!allowed) {
          throw new QuotaExceededError(limit, "wellnessCheckInsToday");
        }
      }

      const updated = [...wellnessCheckIns, checkIn];
      setWellnessCheckIns(updated);

      // Sync to HealthMetrics and HealthHistory
      const currentMetrics: HealthMetrics = {
        steps: healthMetrics?.steps ?? 0,
        ...healthMetrics,
        mood: checkIn.mood,
        stress: checkIn.stressLevel,
        energy: checkIn.energyLevel,
      };

      // We manually update metrics here to avoid double syncing if we called updateMetrics directly inside sync loop.
      // But re-using updateMetrics is cleaner.
      // Wait, updateMetrics is async and does sync.
      // So we can just call updateMetrics(currentMetrics) here?
      // Yes, but we also need to sync wellnessCheckIns.
      // Let's do both.

      // NOTE: updateMetrics will sync healthHistory and healthMetrics.
      // We will sync wellnessCheckIns separately.
      // This results in 2 writes, but it's cleaner.
      // Ideally we would batch them, but our current architecture separates them.

      if (gamification) {
        gamification.updateStreak("checkin", true);
        gamification.checkAchievement("mindful_week", updated.length);
      }

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, {
            wellnessCheckIns: updated,
          });
          await incrementQuota(user.uid, "wellnessCheckInsToday");

          // Now update metrics
          await updateMetrics(currentMetrics);

        } catch (error) {
          const friendlyError = handleFirebaseError(error, 'addWellnessCheckIn', { userId: user.uid });
          setSyncError(friendlyError);
          throw error;
        }
      }
    },
    [
      gamification,
      wellnessCheckIns,
      user?.uid,
      currentPlan,
      healthMetrics, // Added dependency
      updateMetrics // Added dependency
    ]
  );

  const addMentalWellnessPlan = useCallback(
    async (plan: MentalWellnessPlan) => {
      const updated = [...mentalWellnessPlans, plan];
      setMentalWellnessPlans(updated);

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, {
            mentalWellnessPlans: updated,
          });
        } catch (error) {
          const friendlyError = handleFirebaseError(error, 'addMentalWellnessPlan', { userId: user.uid });
          setSyncError(friendlyError);
          throw error;
        }
      }
    },
    [
      mentalWellnessPlans,
      user?.uid,
    ]
  );

  const addExerciseLog = useCallback(
    async (log: ExerciseLog) => {
      if (user?.uid) {
        const { allowed, limit } = await checkQuota(user.uid, currentPlan, "exerciseLogsToday");
        if (!allowed) {
          throw new QuotaExceededError(limit, "exerciseLogsToday");
        }
      }

      const updated = [...exerciseLogs, log];
      setExerciseLogs(updated);

      if (gamification) {
        gamification.updateStreak("workout", true);
        gamification.checkAchievement("first_workout", updated.length);
        gamification.checkAchievement("workout_warrior", updated.length);
      }

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, {
            exerciseLogs: updated,
          });
          await incrementQuota(user.uid, "exerciseLogsToday");
        } catch (error) {
          const friendlyError = handleFirebaseError(error, 'addExerciseLog', { userId: user.uid });
          setSyncError(friendlyError);
          throw error;
        }
      }
    },
    [
      gamification,
      exerciseLogs,
      user?.uid,
      currentPlan,
    ]
  );

  const addMealLog = useCallback(
    async (log: MealLog) => {
      if (user?.uid) {
        const { allowed, limit } = await checkQuota(user.uid, currentPlan, "mealLogsToday");
        if (!allowed) {
          throw new QuotaExceededError(limit, "mealLogsToday");
        }
      }

      const updated = [...mealLogs, log];
      setMealLogs(updated);

      if (gamification) {
        gamification.checkAchievement("meal_tracker", updated.length);
        gamification.checkAchievement("nutrition_master", updated.length);
      }

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, {
            mealLogs: updated,
          });
          await incrementQuota(user.uid, "mealLogsToday");
        } catch (error) {
          const friendlyError = handleFirebaseError(error, 'addMealLog', { userId: user.uid });
          setSyncError(friendlyError);
          throw error;
        }
      }
    },
    [
      gamification,
      mealLogs,
      user?.uid,
      currentPlan,
    ]
  );

  const addReflection = useCallback(
    async (entry: ReflectionEntry) => {
      const updated = [...reflections, entry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setReflections(updated);

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, {
            reflections: updated,
          });
        } catch (error) {
          const friendlyError = handleFirebaseError(error, 'addReflection', { userId: user.uid });
          setSyncError(friendlyError);
          throw error;
        }
      }
    },
    [reflections, user?.uid]
  );


  const clearSyncError = useCallback(() => setSyncError(null), []);

  return useMemo(
    () => ({
      userProfile,
      healthMetrics,
      workoutPlans,
      mealPlans,
      wellnessCheckIns,
      mentalWellnessPlans,
      onboardingComplete,
      healthHistory,
      insights,
      energyForecast,
      momentumInsights,
      exerciseLogs,
      mealLogs,
      reflections,
      reflectionSummary,
      coachPlaybook,
      isLoading: healthDataQuery.isLoading,
      isInitialized: healthDataQuery.isFetched || (!healthDataQuery.isLoading && !user?.uid),
      hasStorageError: healthDataQuery.isError && healthDataQuery.failureCount >= 2,
      storageStatus: {},
      initializationErrors: healthDataQuery.error ? { firebase: healthDataQuery.error } : {},
      syncError,
      retryCount,
      clearSyncError,
      refreshAll,
      saveProfile,
      completeOnboarding,
      updateMetrics,
      logWaterIntake,
      addWorkoutPlan,
      addMealPlan,
      addWellnessCheckIn,
      addMentalWellnessPlan,
      addExerciseLog,
      addMealLog,
      addReflection,
    }),
    [
      userProfile,
      healthMetrics,
      workoutPlans,
      mealPlans,
      wellnessCheckIns,
      mentalWellnessPlans,
      onboardingComplete,
      healthHistory,
      insights,
      energyForecast,
      momentumInsights,
      exerciseLogs,
      mealLogs,
      reflections,
      reflectionSummary,
      coachPlaybook,
      healthDataQuery.isLoading,
      healthDataQuery.isFetched,
      healthDataQuery.isError,
      healthDataQuery.error,
      healthDataQuery.failureCount,
      syncError,
      retryCount,
      user?.uid,
      clearSyncError,
      refreshAll,
      saveProfile,
      completeOnboarding,
      updateMetrics,
      addWorkoutPlan,
      addMealPlan,
      addWellnessCheckIn,
      addMentalWellnessPlan,
      addExerciseLog,
      addMealLog,
      logWaterIntake,
      addReflection,
    ]
  );
});
