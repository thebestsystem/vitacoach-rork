import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useHealthStore } from '@/stores/healthStore';
import { healthSyncService } from '@/utils/healthSync';
import { loadHealthDataFromFirebase, syncHealthDataToFirebase } from '@/utils/firestore';
import { handleFirebaseError } from '@/utils/firebaseErrors';
import { logger } from '@/utils/logger';
import { useShoppingStore } from '@/stores/shoppingStore';

export function useHealthSync() {
  const { user } = useAuth();
  const store = useHealthStore();
  const { setShoppingList } = useShoppingStore();

  // 1. Native Health Sync (Steps, Calories)
  useEffect(() => {
    const syncNativeHealth = async () => {
      try {
        const metrics = await healthSyncService.getDailyMetrics();
        if (metrics.steps > 0 || metrics.calories > 0) {
          // We need to merge with existing store data
          // Access state directly to avoid stale closures in useEffect
          const currentMetrics = useHealthStore.getState().healthMetrics;
          const updatedMetrics = {
            ...currentMetrics,
            steps: Math.max(currentMetrics?.steps ?? 0, metrics.steps),
            calories: Math.max(currentMetrics?.calories ?? 0, metrics.calories),
            sleep: metrics.sleep > 0 ? metrics.sleep / 60 : (currentMetrics?.sleep ?? 0),
            water: currentMetrics?.water ?? 0, // Ensure water isn't lost
          };
          useHealthStore.getState().setHealthMetrics(updatedMetrics);
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
  }, []); // Run once on mount (and setup listeners)

  // 2. Firebase Sync (Load Data)
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!user?.uid) {
        // Clear store or keep generic? Maybe clear to avoid leaking previous user data
        // For now, we assume logout clears state elsewhere or we rely on overwrite
        return;
      }

      try {
        const data = await loadHealthDataFromFirebase(user.uid);

        if (isMounted) {
            if (data) {
                logger.info('Health data loaded successfully', 'useHealthSync', { userId: user.uid });
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

                // Legacy: The Context also synced Shopping List.
                // We forward this to the shopping store if it exists in the payload.
                if (data.shoppingList) {
                    setShoppingList(data.shoppingList);
                }
            } else {
                // Initialize Defaults
                const defaults = {
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
                };

                await syncHealthDataToFirebase(user.uid, defaults);

                if (isMounted) {
                    store.setHealthMetrics({ steps: 0 });
                    store.setOnboardingComplete(false);
                    store.setReflections([]);
                    setShoppingList([]);
                }
            }
        }
      } catch (error) {
        handleFirebaseError(error, 'loadHealthData', { userId: user.uid });
        // Error handling would ideally update a store.syncError state
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);
}
