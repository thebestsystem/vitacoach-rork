import { describe, expect, it, beforeEach } from "bun:test";
import { useHealthStore } from "@/stores/healthStore";

describe("Health Store", () => {
  beforeEach(() => {
    useHealthStore.setState({
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
    });
  });

  it("should initialize with default values", () => {
    const state = useHealthStore.getState();
    expect(state.healthMetrics).toBeNull();
    expect(state.workoutPlans).toEqual([]);
    expect(state.onboardingComplete).toBe(false);
  });

  it("should update health metrics", () => {
    const metrics = {
        steps: 1000,
        calories: 50,
        water: 0.5,
        sleep: 7,
        stress: 3,
        mood: 4,
        energy: 8
    };

    const store = useHealthStore.getState();
    store.updateMetrics(metrics);

    const newState = useHealthStore.getState();
    expect(newState.healthMetrics).toEqual(metrics);

    // Check history update
    const today = new Date().toISOString().split("T")[0];
    const historyEntry = newState.healthHistory.find(h => h.date === today);
    expect(historyEntry).toBeDefined();
    expect(historyEntry?.metrics).toEqual(metrics);
  });

  it("should add a wellness check-in and update metrics", () => {
    const checkIn = {
        id: "1",
        date: new Date().toISOString(),
        mood: 5,
        stressLevel: 2,
        energyLevel: 9,
        notes: "Feeling great",
        tags: []
    };

    const store = useHealthStore.getState();
    store.setHealthMetrics({ steps: 500 }); // Pre-set metrics
    store.addWellnessCheckIn(checkIn);

    const newState = useHealthStore.getState();
    expect(newState.wellnessCheckIns).toHaveLength(1);
    expect(newState.wellnessCheckIns[0]).toEqual(checkIn);

    // Should update current metrics
    expect(newState.healthMetrics?.mood).toBe(5);
    expect(newState.healthMetrics?.stress).toBe(2);
    expect(newState.healthMetrics?.energy).toBe(9);
    expect(newState.healthMetrics?.steps).toBe(500); // Should preserve steps
  });
});
