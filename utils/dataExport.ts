import { db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
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
  Achievement,
  Streak,
  WeeklyGoal,
} from "@/types/health";

export interface UserExportData {
  userData: {
    email: string | null;
    uid: string;
    createdAt: string;
    role: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
  };
  healthData: {
    userProfile: UserProfile | null;
    healthMetrics: HealthMetrics | null;
    healthHistory: HealthHistory[];
    workoutPlans: WorkoutPlan[];
    mealPlans: MealPlan[];
    wellnessCheckIns: WellnessCheckIn[];
    mentalWellnessPlans: MentalWellnessPlan[];
    exerciseLogs: ExerciseLog[];
    mealLogs: MealLog[];
    reflections: ReflectionEntry[];
    onboardingComplete: boolean;
  };
  gamificationData: {
    achievements: Achievement[];
    streaks: Streak[];
    weeklyGoals: WeeklyGoal[];
    totalPoints: number;
    level: number;
  };
  notificationSettings?: {
    exerciseReminders: boolean;
    exerciseTime: string;
    waterReminders: boolean;
    waterInterval: number;
    mealReminders: boolean;
    mealTimes: string[];
    checkinReminders: boolean;
    checkinTime: string;
  };
  exportedAt: string;
  exportVersion: string;
}

export async function exportUserData(userId: string): Promise<UserExportData> {
  console.log('[DataExport] Starting data export for user:', userId);

  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  
  if (!userDoc.exists()) {
    throw new Error("User document not found");
  }

  const userData = userDoc.data();

  const healthDocRef = doc(db, "health", userId);
  const healthDoc = await getDoc(healthDocRef);
  const healthData = healthDoc.exists() ? healthDoc.data() : {};

  const gamificationDocRef = doc(db, "gamification", userId);
  const gamificationDoc = await getDoc(gamificationDocRef);
  const gamificationData = gamificationDoc.exists() ? gamificationDoc.data() : {};

  const notificationDocRef = doc(db, "notifications", userId);
  const notificationDoc = await getDoc(notificationDocRef);
  const notificationSettings = notificationDoc.exists() ? notificationDoc.data().settings : undefined;

  const exportData: UserExportData = {
    userData: {
      email: userData.email || null,
      uid: userId,
      createdAt: userData.createdAt || new Date().toISOString(),
      role: userData.role || "user",
      subscriptionPlan: userData.subscriptionPlan || "free",
      subscriptionStatus: userData.subscriptionStatus || "trial",
    },
    healthData: {
      userProfile: healthData.userProfile || null,
      healthMetrics: healthData.healthMetrics || null,
      healthHistory: healthData.healthHistory || [],
      workoutPlans: healthData.workoutPlans || [],
      mealPlans: healthData.mealPlans || [],
      wellnessCheckIns: healthData.wellnessCheckIns || [],
      mentalWellnessPlans: healthData.mentalWellnessPlans || [],
      exerciseLogs: healthData.exerciseLogs || [],
      mealLogs: healthData.mealLogs || [],
      reflections: healthData.reflections || [],
      onboardingComplete: healthData.onboardingComplete || false,
    },
    gamificationData: {
      achievements: gamificationData.achievements || [],
      streaks: gamificationData.streaks || [],
      weeklyGoals: gamificationData.weeklyGoals || [],
      totalPoints: gamificationData.totalPoints || 0,
      level: gamificationData.level || 1,
    },
    notificationSettings,
    exportedAt: new Date().toISOString(),
    exportVersion: "1.0.0",
  };

  console.log('[DataExport] Data export completed successfully');
  return exportData;
}

export function generateExportFileName(email: string | null): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedEmail = (email || 'user').replace(/[^a-zA-Z0-9]/g, '_');
  return `wellness_data_${sanitizedEmail}_${timestamp}.json`;
}

export function downloadJsonFile(data: UserExportData, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
