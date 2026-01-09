import type { ExerciseLog, MealLog, WellnessCheckIn } from "@/types/health";

export function createWorkoutUpdate(log: ExerciseLog): string {
  const duration = log.duration ? ` for ${log.duration} minutes` : "";
  return `Completed a ${log.type} workout${duration}! 💪`;
}

export function createMealUpdate(log: MealLog): string {
  const calories = log.calories ? ` (${log.calories} cal)` : "";
  return `Logged a healthy ${log.mealType}${calories} 🍽️`;
}

export function createCheckInUpdate(checkIn: WellnessCheckIn): string {
  const energyText = checkIn.energyLevel
    ? ` with energy level ${checkIn.energyLevel}/10`
    : "";
  return `Wellness check-in: ${checkIn.mood}${energyText}`;
}

export function getMoodEmoji(energyLevel: number): string {
  const mood = energyLevel;
  if (mood >= 8) return "😄";
  if (mood >= 6) return "🙂";
  if (mood >= 4) return "😐";
  if (mood >= 2) return "😕";
  return "😢";
}

export function calculateWeeklyGoalProgress(
  totalWorkouts: number,
  weeklyGoal: number = 5
): number {
  return Math.min(Math.round((totalWorkouts / weeklyGoal) * 100), 100);
}

export function generateEncouragementMessage(
  userName: string,
  activityType: "workout" | "meal" | "checkIn"
): string {
  const messages = {
    workout: [
      `Great job on your workout, ${userName}! Keep it up! 💪`,
      `${userName}, you're crushing it! Keep moving! 🔥`,
      `Awesome workout, ${userName}! You're an inspiration! ⭐`,
    ],
    meal: [
      `Nice healthy choice, ${userName}! 🥗`,
      `${userName}, you're fueling your body right! 🍎`,
      `Great nutrition tracking, ${userName}! Keep it going! 🎯`,
    ],
    checkIn: [
      `Thanks for checking in, ${userName}! How are you feeling? 💚`,
      `${userName}, your consistency is amazing! 🌟`,
      `Way to stay mindful, ${userName}! 🧘`,
    ],
  };

  const options = messages[activityType];
  return options[Math.floor(Math.random() * options.length)];
}
