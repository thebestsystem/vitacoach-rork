import React, { useMemo, useCallback } from "react";
import type { ReactNode } from "react";
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
} from "@/types/health";
import { useAuth } from "./AuthContext";
import { useSubscription } from "./SubscriptionContext";
import { useGamification } from "./GamificationContext";
import { checkQuota, incrementQuota } from "@/utils/quotas";
import { QuotaExceededError } from "@/utils/errors";
import {
  syncPartialHealthData,
  loadHealthDataFromFirebase
} from "@/utils/firestore";
import { generateInsights } from "@/utils/healthAnalyzer";
import { generateEnergyForecast } from "@/utils/energyForecast";
import { generateMomentumInsights } from "@/utils/momentum";
import { handleFirebaseError, type UserFriendlyError } from "@/utils/firebaseErrors";
import { summarizeReflections } from "@/utils/reflectionInsights";
import { generateCoachPlaybook } from "@/utils/coachPlaybook";
import { useHealthStore } from "@/stores/healthStore";

// The Provider is now a pass-through since state is in Zustand
export const HealthProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

// The Hook wraps the Store + Business Logic (Sync/Quotas)
export const useHealth = () => {
  const { user } = useAuth();
  const { currentPlan } = useSubscription();
  const gamification = useGamification();
  const store = useHealthStore();

  // Derived State (Computed)
  const insights = useMemo<HealthInsight[]>(() => {
    if (!store.healthHistory || store.healthHistory.length === 0 || !store.healthMetrics || !store.userProfile) {
      return [];
    }
    return generateInsights({
      currentMetrics: store.healthMetrics,
      history: store.healthHistory,
      checkIns: store.wellnessCheckIns,
      userProfile: store.userProfile,
    });
  }, [store.healthHistory, store.healthMetrics, store.userProfile, store.wellnessCheckIns]);

  const energyForecast = useMemo(
    () =>
      generateEnergyForecast({
        history: store.healthHistory,
        checkIns: store.wellnessCheckIns,
        current: store.healthMetrics,
      }),
    [store.healthHistory, store.wellnessCheckIns, store.healthMetrics]
  );

  const momentumInsights = useMemo(
    () =>
      generateMomentumInsights({
        history: store.healthHistory,
        checkIns: store.wellnessCheckIns,
      }),
    [store.healthHistory, store.wellnessCheckIns]
  );

  const reflectionSummary = useMemo(
    () => summarizeReflections(store.reflections),
    [store.reflections]
  );

  const coachPlaybook = useMemo(
    () =>
      generateCoachPlaybook({
        current: store.healthMetrics,
        history: store.healthHistory,
        checkIns: store.wellnessCheckIns,
        reflections: store.reflections,
        energyForecast,
      }),
    [store.healthMetrics, store.healthHistory, store.wellnessCheckIns, store.reflections, energyForecast]
  );

  // ACTIONS (Proxy to Store + Side Effects)

  const refreshAll = useCallback(async () => {
     if (user?.uid) {
         try {
            const data = await loadHealthDataFromFirebase(user.uid);
            if (data) {
                store.setUserProfile(data.userProfile);
                store.setHealthMetrics(data.healthMetrics);
                store.setWorkoutPlans(data.workoutPlans);
                store.setMealPlans(data.mealPlans);
                store.setWellnessCheckIns(data.wellnessCheckIns);
                store.setMentalWellnessPlans(data.mentalWellnessPlans);
                store.setOnboardingComplete(data.onboardingComplete);
                store.setHealthHistory(data.healthHistory);
                store.setExerciseLogs(data.exerciseLogs);
                store.setMealLogs(data.mealLogs);
                store.setReflections(data.reflections ?? []);
            }
         } catch (e) {
             console.error("Refresh failed", e);
         }
     }
  }, [user?.uid, store]);

  const saveProfile = useCallback(
    async (profile: UserProfile) => {
      store.setUserProfile(profile);
      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, { userProfile: profile });
        } catch (error) {
          handleFirebaseError(error, 'saveProfile', { userId: user.uid });
          throw error;
        }
      }
    },
    [user?.uid, store]
  );

  const completeOnboarding = useCallback(
    async (profile: UserProfile) => {
      store.setUserProfile(profile);
      store.setOnboardingComplete(true);
      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, {
            userProfile: profile,
            onboardingComplete: true,
          });
        } catch (error) {
          handleFirebaseError(error, 'completeOnboarding', { userId: user.uid });
          throw error;
        }
      }
    },
    [user?.uid, store]
  );

  const updateMetrics = useCallback(
    async (metrics: HealthMetrics) => {
      store.updateMetrics(metrics); // Updates history internally

      // Need to get the updated history to sync
      // Since updateMetrics in store is synchronous, we can calculate what the new history would be
      // OR we can just read the store state?
      // Zustand state updates are synchronous but `store` variable here might be a closure?
      // `useHealthStore` returns the current state.
      // However, inside this callback, `store` is the object returned by the hook at render time.
      // To get the *latest* state after an update, we might need to rely on the fact that syncPartialHealthData
      // can just take the value we passed.
      // But we need to sync history too.
      // Let's re-calculate history here to be safe for the sync.

      const today = new Date().toISOString().split("T")[0];
      // We take the *current* history from the closure and append.
      // Ideally we would use `useHealthStore.getState().healthHistory` but we are inside a hook.
      // Let's rely on the store action for the *State* and reconstruct the payload for the *Sync*.

      const historyEntry: HealthHistory = {
        date: today,
        metrics,
      };

      const updatedHistory = [
        ...store.healthHistory.filter((h) => h.date !== today),
        historyEntry,
      ];

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
          handleFirebaseError(error, 'updateMetrics', { userId: user.uid });
          throw error;
        }
      }
    },
    [gamification, store, user?.uid]
  );

  const logWaterIntake = useCallback(
    async (amount: number) => {
      store.logWaterIntake(amount);

      // We need to calculate the new water amount to sync
      const currentWater = store.healthMetrics?.water ?? 0;
      const newWater = parseFloat((currentWater + amount).toFixed(2));
      const metrics = { ...store.healthMetrics, water: newWater, steps: store.healthMetrics?.steps ?? 0 }; // Ensure steps/others

      await updateMetrics(metrics);
    },
    [store, updateMetrics]
  );

  const addWorkoutPlan = useCallback(
    async (plan: WorkoutPlan) => {
      if (user?.uid) {
        const { allowed, limit } = await checkQuota(user.uid, currentPlan, "workoutPlansThisMonth");
        if (!allowed) {
          throw new QuotaExceededError(limit, "workoutPlansThisMonth");
        }
      }

      store.addWorkoutPlan(plan);
      const updated = [...store.workoutPlans, plan];

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, { workoutPlans: updated });
          await incrementQuota(user.uid, "workoutPlansThisMonth");
        } catch (error) {
          handleFirebaseError(error, 'addWorkoutPlan', { userId: user.uid });
          throw error;
        }
      }
    },
    [store, user?.uid, currentPlan]
  );

  const addMealPlan = useCallback(
    async (plan: MealPlan) => {
      if (user?.uid) {
        const { allowed, limit } = await checkQuota(user.uid, currentPlan, "mealPlansThisMonth");
        if (!allowed) {
          throw new QuotaExceededError(limit, "mealPlansThisMonth");
        }
      }

      store.addMealPlan(plan);
      const updated = [...store.mealPlans, plan];

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, { mealPlans: updated });
          await incrementQuota(user.uid, "mealPlansThisMonth");
        } catch (error) {
          handleFirebaseError(error, 'addMealPlan', { userId: user.uid });
          throw error;
        }
      }
    },
    [store, user?.uid, currentPlan]
  );

  const addWellnessCheckIn = useCallback(
    async (checkIn: WellnessCheckIn) => {
      if (user?.uid) {
        const { allowed, limit } = await checkQuota(user.uid, currentPlan, "wellnessCheckInsToday");
        if (!allowed) {
          throw new QuotaExceededError(limit, "wellnessCheckInsToday");
        }
      }

      store.addWellnessCheckIn(checkIn);
      const updated = [...store.wellnessCheckIns, checkIn];

      // Update metrics for sync
      const currentMetrics: HealthMetrics = {
        steps: store.healthMetrics?.steps ?? 0,
        ...store.healthMetrics,
        mood: checkIn.mood,
        stress: checkIn.stressLevel,
        energy: checkIn.energyLevel,
      };

      if (gamification) {
        gamification.updateStreak("checkin", true);
        gamification.checkAchievement("mindful_week", updated.length);
      }

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, { wellnessCheckIns: updated });
          await incrementQuota(user.uid, "wellnessCheckInsToday");
          // Sync metrics (which also syncs history)
          await updateMetrics(currentMetrics);
        } catch (error) {
          handleFirebaseError(error, 'addWellnessCheckIn', { userId: user.uid });
          throw error;
        }
      }
    },
    [gamification, store, user?.uid, currentPlan, updateMetrics]
  );

  const addMentalWellnessPlan = useCallback(
    async (plan: MentalWellnessPlan) => {
      store.addMentalWellnessPlan(plan);
      const updated = [...store.mentalWellnessPlans, plan];

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, { mentalWellnessPlans: updated });
        } catch (error) {
          handleFirebaseError(error, 'addMentalWellnessPlan', { userId: user.uid });
          throw error;
        }
      }
    },
    [store, user?.uid]
  );

  const addExerciseLog = useCallback(
    async (log: ExerciseLog) => {
      if (user?.uid) {
        const { allowed, limit } = await checkQuota(user.uid, currentPlan, "exerciseLogsToday");
        if (!allowed) {
          throw new QuotaExceededError(limit, "exerciseLogsToday");
        }
      }

      store.addExerciseLog(log);
      const updated = [...store.exerciseLogs, log];

      if (gamification) {
        gamification.updateStreak("workout", true);
        gamification.checkAchievement("first_workout", updated.length);
        gamification.checkAchievement("workout_warrior", updated.length);
      }

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, { exerciseLogs: updated });
          await incrementQuota(user.uid, "exerciseLogsToday");
        } catch (error) {
          handleFirebaseError(error, 'addExerciseLog', { userId: user.uid });
          throw error;
        }
      }
    },
    [gamification, store, user?.uid, currentPlan]
  );

  const addMealLog = useCallback(
    async (log: MealLog) => {
      if (user?.uid) {
        const { allowed, limit } = await checkQuota(user.uid, currentPlan, "mealLogsToday");
        if (!allowed) {
          throw new QuotaExceededError(limit, "mealLogsToday");
        }
      }

      store.addMealLog(log);
      const updated = [...store.mealLogs, log];

      if (gamification) {
        gamification.checkAchievement("meal_tracker", updated.length);
        gamification.checkAchievement("nutrition_master", updated.length);
      }

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, { mealLogs: updated });
          await incrementQuota(user.uid, "mealLogsToday");
        } catch (error) {
          handleFirebaseError(error, 'addMealLog', { userId: user.uid });
          throw error;
        }
      }
    },
    [gamification, store, user?.uid, currentPlan]
  );

  const addReflection = useCallback(
    async (entry: ReflectionEntry) => {
      store.addReflection(entry);
      // Sort for sync
      const updated = [...store.reflections, entry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      if (user?.uid) {
        try {
          await syncPartialHealthData(user.uid, { reflections: updated });
        } catch (error) {
          handleFirebaseError(error, 'addReflection', { userId: user.uid });
          throw error;
        }
      }
    },
    [store, user?.uid]
  );

  const clearSyncError = useCallback(() => {}, []); // No-op as we use store mostly

  return {
    ...store, // Spread all store state
    insights,
    energyForecast,
    momentumInsights,
    reflectionSummary,
    coachPlaybook,
    isLoading: !store._hasHydrated,
    isInitialized: store._hasHydrated,
    hasStorageError: false,
    storageStatus: {},
    initializationErrors: {},
    syncError: null,
    retryCount: 0,
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
  };
};
