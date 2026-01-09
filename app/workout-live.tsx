import { Play, Pause, RotateCcw, Check, X, ChevronRight, Trophy } from "lucide-react-native";
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import colors from "@/constants/colors";
import { useHealth } from "@/contexts/HealthContext";
import { lightImpact, successFeedback, mediumImpact } from "@/utils/haptics";
import type { ExerciseLog, WorkoutPlan } from "@/types/health";

export default function WorkoutLiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { workoutPlans, addExerciseLog } = useHealth();

  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [exerciseTime, setExerciseTime] = useState<number>(0);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        setExerciseTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStart = () => {
    lightImpact();
    setIsRunning(true);
    if (!workoutStartTime) {
      setWorkoutStartTime(Date.now());
    }
  };

  const handlePause = () => {
    mediumImpact();
    setIsRunning(false);
  };

  const handleReset = () => {
    mediumImpact();
    setIsRunning(false);
    setExerciseTime(0);
  };

  const handleNextExercise = () => {
    successFeedback();
    const newCompleted = new Set(completedExercises);
    newCompleted.add(currentExerciseIndex);
    setCompletedExercises(newCompleted);

    if (selectedPlan && currentExerciseIndex < selectedPlan.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setExerciseTime(0);
      setIsRunning(false);
    } else {
      handleCompleteWorkout();
    }
  };

  const handleCompleteWorkout = async () => {
    successFeedback();
    
    if (!selectedPlan) return;

    const estimatedCalories = Math.floor(elapsedTime / 60 * 8);
    
    const log: ExerciseLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: selectedPlan.title,
      duration: Math.floor(elapsedTime / 60),
      calories: estimatedCalories,
      intensity: selectedPlan.difficulty === "hard" ? "high" : selectedPlan.difficulty === "easy" ? "low" : "medium",
      notes: `Completed ${completedExercises.size + 1}/${selectedPlan.exercises.length} exercises`,
    };

    await addExerciseLog(log);

    setIsRunning(false);
    setElapsedTime(0);
    setExerciseTime(0);
    setCurrentExerciseIndex(0);
    setCompletedExercises(new Set());
    setWorkoutStartTime(null);
    setSelectedPlan(null);
  };

  const handleSelectPlan = (plan: WorkoutPlan) => {
    lightImpact();
    setSelectedPlan(plan);
    setCurrentExerciseIndex(0);
    setElapsedTime(0);
    setExerciseTime(0);
    setCompletedExercises(new Set());
    setIsRunning(false);
  };

  const currentExercise = selectedPlan?.exercises[currentExerciseIndex];
  const progress = selectedPlan ? (completedExercises.size / selectedPlan.exercises.length) * 100 : 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              router.back();
            }}
            style={styles.backButton}
          >
            <X size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Workout</Text>
          <View style={{ width: 40 }} />
        </View>

        {!selectedPlan && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.plansList}>
              <Text style={styles.sectionTitle}>Choose a Workout Plan</Text>
              {workoutPlans.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No workout plans available</Text>
                  <Text style={styles.emptySubtext}>Create one in the Coach tab!</Text>
                </View>
              ) : (
                workoutPlans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={styles.planCard}
                    onPress={() => handleSelectPlan(plan)}
                  >
                    <View style={styles.planHeader}>
                      <View style={styles.planInfo}>
                        <Text style={styles.planTitle}>{plan.title}</Text>
                        <Text style={styles.planDescription}>{plan.description}</Text>
                      </View>
                      <ChevronRight size={24} color={colors.textSecondary} strokeWidth={2} />
                    </View>
                    <View style={styles.planMeta}>
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{plan.duration} min</Text>
                      </View>
                      <View
                        style={[
                          styles.planBadge,
                          {
                            backgroundColor:
                              plan.difficulty === "hard"
                                ? colors.error + "20"
                                : plan.difficulty === "easy"
                                  ? colors.success + "20"
                                  : colors.warning + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.planBadgeText,
                            {
                              color:
                                plan.difficulty === "hard"
                                  ? colors.error
                                  : plan.difficulty === "easy"
                                    ? colors.success
                                    : colors.warning,
                            },
                          ]}
                        >
                          {plan.difficulty.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{plan.exercises.length} exercises</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        )}

        {selectedPlan && currentExercise && (
          <View style={styles.workoutContainer}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {completedExercises.size} / {selectedPlan.exercises.length} completed
              </Text>
            </View>

            <LinearGradient
              colors={[colors.gradient1[0], colors.gradient1[1]] as readonly [string, string, ...string[]]}
              style={styles.timerCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Animated.View style={{ transform: [{ scale: isRunning ? pulseAnim : 1 }] }}>
                <Text style={styles.timerText}>{formatTime(exerciseTime)}</Text>
              </Animated.View>
              <Text style={styles.timerLabel}>Exercise Time</Text>
              <View style={styles.timerDivider} />
              <Text style={styles.totalTime}>{formatTime(elapsedTime)} total</Text>
            </LinearGradient>

            <View style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseNumber}>
                  <Text style={styles.exerciseNumberText}>#{currentExerciseIndex + 1}</Text>
                </View>
                <Trophy size={24} color={colors.warning} strokeWidth={2} />
              </View>
              <Text style={styles.exerciseName}>{currentExercise.name}</Text>
              <View style={styles.exerciseDetails}>
                {currentExercise.reps && (
                  <View style={styles.exerciseDetail}>
                    <Text style={styles.exerciseDetailValue}>{currentExercise.reps}</Text>
                    <Text style={styles.exerciseDetailLabel}>reps</Text>
                  </View>
                )}
                {currentExercise.sets && (
                  <View style={styles.exerciseDetail}>
                    <Text style={styles.exerciseDetailValue}>{currentExercise.sets}</Text>
                    <Text style={styles.exerciseDetailLabel}>sets</Text>
                  </View>
                )}
                {currentExercise.duration && (
                  <View style={styles.exerciseDetail}>
                    <Text style={styles.exerciseDetailValue}>{currentExercise.duration}s</Text>
                    <Text style={styles.exerciseDetailLabel}>duration</Text>
                  </View>
                )}
                {currentExercise.rest && (
                  <View style={styles.exerciseDetail}>
                    <Text style={styles.exerciseDetailValue}>{currentExercise.rest}s</Text>
                    <Text style={styles.exerciseDetailLabel}>rest</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
                <RotateCcw size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={isRunning ? handlePause : handleStart}
              >
                {isRunning ? (
                  <Pause size={32} color={colors.surface} strokeWidth={2.5} fill={colors.surface} />
                ) : (
                  <Play size={32} color={colors.surface} strokeWidth={2.5} fill={colors.surface} />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleNextExercise}>
                <Check size={24} color={colors.success} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {selectedPlan.exercises.length > 0 && (
              <View style={styles.nextExercises}>
                <Text style={styles.nextTitle}>Next Exercises</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedPlan.exercises
                    .slice(currentExerciseIndex + 1, currentExerciseIndex + 4)
                    .map((exercise, index) => (
                      <View
                        key={index}
                        style={[
                          styles.nextExerciseCard,
                          completedExercises.has(currentExerciseIndex + index + 1) && styles.completedCard,
                        ]}
                      >
                        <Text style={styles.nextExerciseName}>{exercise.name}</Text>
                        {exercise.reps && (
                          <Text style={styles.nextExerciseDetail}>{exercise.reps} reps</Text>
                        )}
                      </View>
                    ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 20,
  },
  plansList: {
    gap: 16,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  planMeta: {
    flexDirection: "row" as const,
    gap: 8,
    flexWrap: "wrap" as const,
  },
  planBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center" as const,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  workoutContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: "hidden" as const,
    marginBottom: 12,
  },
  progressFill: {
    height: "100%" as const,
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    textAlign: "center" as const,
  },
  timerCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center" as const,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  timerText: {
    fontSize: 72,
    fontWeight: "700" as const,
    color: colors.surface,
    letterSpacing: 4,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.surface,
    opacity: 0.9,
    marginTop: 8,
  },
  timerDivider: {
    width: 60,
    height: 2,
    backgroundColor: colors.surface,
    opacity: 0.3,
    marginVertical: 16,
  },
  totalTime: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.surface,
    opacity: 0.8,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  exerciseHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  exerciseNumber: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  exerciseNumberText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.surface,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 20,
  },
  exerciseDetails: {
    flexDirection: "row" as const,
    gap: 16,
  },
  exerciseDetail: {
    alignItems: "center" as const,
  },
  exerciseDetailValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.primary,
    marginBottom: 4,
  },
  exerciseDetailLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
  },
  controls: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 20,
    marginBottom: 24,
  },
  primaryButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  nextExercises: {
    marginBottom: 20,
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  nextExerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 2,
    borderColor: colors.border,
  },
  completedCard: {
    opacity: 0.5,
    borderColor: colors.success,
  },
  nextExerciseName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 8,
  },
  nextExerciseDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
