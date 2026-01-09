import { useCallback } from "react";
import { useAccountability } from "@/contexts/AccountabilityContext";
import type { ExerciseLog, MealLog, WellnessCheckIn } from "@/types/health";
import {
  createWorkoutUpdate,
  createMealUpdate,
  createCheckInUpdate,
} from "@/utils/accountabilitySync";

export function useAccountabilitySync() {
  const accountability = useAccountability();

  const shareWorkout = useCallback(
    async (log: ExerciseLog, circleId?: string) => {
      const targetCircleId = circleId || accountability.selectedCircleId;
      if (!targetCircleId) return;

      try {
        const content = createWorkoutUpdate(log);
        await accountability.shareProgress(targetCircleId, "workout", content, log);
      } catch (error) {
        console.error("Failed to share workout:", error);
      }
    },
    [accountability]
  );

  const shareMeal = useCallback(
    async (log: MealLog, circleId?: string) => {
      const targetCircleId = circleId || accountability.selectedCircleId;
      if (!targetCircleId) return;

      try {
        const content = createMealUpdate(log);
        await accountability.shareProgress(targetCircleId, "meal", content, log);
      } catch (error) {
        console.error("Failed to share meal:", error);
      }
    },
    [accountability]
  );

  const shareCheckIn = useCallback(
    async (checkIn: WellnessCheckIn, circleId?: string) => {
      const targetCircleId = circleId || accountability.selectedCircleId;
      if (!targetCircleId) return;

      try {
        const content = createCheckInUpdate(checkIn);
        await accountability.shareProgress(targetCircleId, "checkIn", content, checkIn);
      } catch (error) {
        console.error("Failed to share check-in:", error);
      }
    },
    [accountability]
  );

  const shareCustomProgress = useCallback(
    async (
      content: string,
      type: "milestone" | "reflection" = "milestone",
      circleId?: string
    ) => {
      const targetCircleId = circleId || accountability.selectedCircleId;
      if (!targetCircleId) return;

      try {
        await accountability.shareProgress(targetCircleId, type, content);
      } catch (error) {
        console.error("Failed to share progress:", error);
      }
    },
    [accountability]
  );

  return {
    shareWorkout,
    shareMeal,
    shareCheckIn,
    shareCustomProgress,
    hasActiveCircle: !!accountability.selectedCircleId,
    selectedCircle: accountability.selectedCircle,
  };
}
