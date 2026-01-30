import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  ReflectionEntry,
} from '@/types/health';

interface HealthState {
  // State
  userProfile: UserProfile | null;
  healthMetrics: HealthMetrics | null;
  workoutPlans: WorkoutPlan[];
  mealPlans: MealPlan[];
  wellnessCheckIns: WellnessCheckIn[];
  mentalWellnessPlans: MentalWellnessPlan[];
  onboardingComplete: boolean;
  healthHistory: HealthHistory[];
  exerciseLogs: ExerciseLog[];
  mealLogs: MealLog[];
  reflections: ReflectionEntry[];
  _hasHydrated: boolean;

  // Base Setters (for Sync)
  setHasHydrated: (state: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setHealthMetrics: (metrics: HealthMetrics | null) => void;
  setWorkoutPlans: (plans: WorkoutPlan[]) => void;
  setMealPlans: (plans: MealPlan[]) => void;
  setWellnessCheckIns: (checkIns: WellnessCheckIn[]) => void;
  setMentalWellnessPlans: (plans: MentalWellnessPlan[]) => void;
  setOnboardingComplete: (status: boolean) => void;
  setHealthHistory: (history: HealthHistory[]) => void;
  setExerciseLogs: (logs: ExerciseLog[]) => void;
  setMealLogs: (logs: MealLog[]) => void;
  setReflections: (reflections: ReflectionEntry[]) => void;

  // Actions
  updateMetrics: (metrics: HealthMetrics) => void;
  logWaterIntake: (amount: number) => void;
  addWorkoutPlan: (plan: WorkoutPlan) => void;
  addMealPlan: (plan: MealPlan) => void;
  addWellnessCheckIn: (checkIn: WellnessCheckIn) => void;
  addMentalWellnessPlan: (plan: MentalWellnessPlan) => void;
  addExerciseLog: (log: ExerciseLog) => void;
  addMealLog: (log: MealLog) => void;
  addReflection: (entry: ReflectionEntry) => void;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      // Initial State
      userProfile: null,
      healthMetrics: null,
      workoutPlans: [],
      mealPlans: [],
      wellnessCheckIns: [],
      mentalWellnessPlans: [],
      onboardingComplete: false,
      healthHistory: [],
      exerciseLogs: [],
      mealLogs: [],
      reflections: [],
      _hasHydrated: false,

      // Setters
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setUserProfile: (userProfile) => set({ userProfile }),
      setHealthMetrics: (healthMetrics) => set({ healthMetrics }),
      setWorkoutPlans: (workoutPlans) => set({ workoutPlans }),
      setMealPlans: (mealPlans) => set({ mealPlans }),
      setWellnessCheckIns: (wellnessCheckIns) => set({ wellnessCheckIns }),
      setMentalWellnessPlans: (mentalWellnessPlans) => set({ mentalWellnessPlans }),
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
      setHealthHistory: (healthHistory) => set({ healthHistory }),
      setExerciseLogs: (exerciseLogs) => set({ exerciseLogs }),
      setMealLogs: (mealLogs) => set({ mealLogs }),
      setReflections: (reflections) => set({ reflections }),

      // Complex Actions
      updateMetrics: (metrics) => {
        const today = new Date().toISOString().split("T")[0];
        set((state) => {
          const updatedHistory = [
            ...state.healthHistory.filter((h) => h.date !== today),
            { date: today, metrics },
          ];
          return {
            healthMetrics: metrics,
            healthHistory: updatedHistory,
          };
        });
      },

      logWaterIntake: (amount) => {
        const state = get();
        const currentMetrics = state.healthMetrics || { steps: 0 };
        const updatedMetrics = {
          ...currentMetrics,
          water: parseFloat(((currentMetrics.water ?? 0) + amount).toFixed(2)),
        };
        get().updateMetrics(updatedMetrics);
      },

      addWorkoutPlan: (plan) =>
        set((state) => ({ workoutPlans: [...state.workoutPlans, plan] })),

      addMealPlan: (plan) =>
        set((state) => ({ mealPlans: [...state.mealPlans, plan] })),

      addWellnessCheckIn: (checkIn) => {
        set((state) => {
           // Also update current metrics with mood/stress/energy
           const currentMetrics = state.healthMetrics || { steps: 0 };
           const updatedMetrics = {
             ...currentMetrics,
             mood: checkIn.mood,
             stress: checkIn.stressLevel,
             energy: checkIn.energyLevel,
           };

           // We need to trigger updateMetrics logic to sync history too
           // But we can't call get().updateMetrics inside set() easily without breaking the batch?
           // Actually we can just do it manually here for atomicity
           const today = new Date().toISOString().split("T")[0];
           const updatedHistory = [
             ...state.healthHistory.filter((h) => h.date !== today),
             { date: today, metrics: updatedMetrics },
           ];

           return {
             wellnessCheckIns: [...state.wellnessCheckIns, checkIn],
             healthMetrics: updatedMetrics,
             healthHistory: updatedHistory,
           };
        });
      },

      addMentalWellnessPlan: (plan) =>
        set((state) => ({ mentalWellnessPlans: [...state.mentalWellnessPlans, plan] })),

      addExerciseLog: (log) =>
        set((state) => ({ exerciseLogs: [...state.exerciseLogs, log] })),

      addMealLog: (log) =>
        set((state) => ({ mealLogs: [...state.mealLogs, log] })),

      addReflection: (entry) =>
        set((state) => ({
          reflections: [...state.reflections, entry].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        })),
    }),
    {
      name: 'health-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
