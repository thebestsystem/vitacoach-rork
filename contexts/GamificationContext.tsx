import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { Achievement, Streak, WeeklyGoal, NotificationSettings } from "@/types/health";
import { useAuth } from "./AuthContext";
import {
  syncGamificationDataToFirebase,
  loadGamificationDataFromFirebase,
  subscribeToUserDocument,
  firestoreCollections,
  syncPartialGamificationData,
} from "@/utils/firestore";
import {
  requestNotificationPermissions,
  scheduleExerciseReminder,
  scheduleWaterReminders,
  scheduleMealReminders,
  scheduleCheckinReminder,
  cancelAllNotifications,
  sendAchievementNotification,
} from "@/utils/notifications";

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_step",
    type: "steps",
    title: "First Steps",
    description: "Walk 1,000 steps in a day",
    icon: "👣",
    unlocked: false,
    progress: 0,
    target: 1000,
    rarity: "common",
  },
  {
    id: "walker",
    type: "steps",
    title: "Daily Walker",
    description: "Walk 10,000 steps in a day",
    icon: "🚶",
    unlocked: false,
    progress: 0,
    target: 10000,
    rarity: "rare",
  },
  {
    id: "marathon",
    type: "steps",
    title: "Marathon Walker",
    description: "Walk 20,000 steps in a day",
    icon: "🏃",
    unlocked: false,
    progress: 0,
    target: 20000,
    rarity: "epic",
  },
  {
    id: "first_workout",
    type: "workout",
    title: "First Workout",
    description: "Complete your first workout",
    icon: "💪",
    unlocked: false,
    progress: 0,
    target: 1,
    rarity: "common",
  },
  {
    id: "workout_warrior",
    type: "workout",
    title: "Workout Warrior",
    description: "Complete 10 workouts",
    icon: "🏋️",
    unlocked: false,
    progress: 0,
    target: 10,
    rarity: "rare",
  },
  {
    id: "week_streak",
    type: "streak",
    title: "Week Warrior",
    description: "Maintain a 7-day workout streak",
    icon: "🔥",
    unlocked: false,
    progress: 0,
    target: 7,
    rarity: "rare",
  },
  {
    id: "month_streak",
    type: "streak",
    title: "Consistency Champion",
    description: "Maintain a 30-day workout streak",
    icon: "⚡",
    unlocked: false,
    progress: 0,
    target: 30,
    rarity: "legendary",
  },
  {
    id: "hydration_hero",
    type: "water",
    title: "Hydration Hero",
    description: "Drink 2L of water for 7 days",
    icon: "💧",
    unlocked: false,
    progress: 0,
    target: 7,
    rarity: "rare",
  },
  {
    id: "sleep_champion",
    type: "sleep",
    title: "Sleep Champion",
    description: "Get 7+ hours of sleep for 7 days",
    icon: "🌙",
    unlocked: false,
    progress: 0,
    target: 7,
    rarity: "rare",
  },
  {
    id: "mindful_week",
    type: "checkin",
    title: "Mindful Week",
    description: "Complete wellness check-ins for 7 days",
    icon: "🧘",
    unlocked: false,
    progress: 0,
    target: 7,
    rarity: "rare",
  },
  {
    id: "meal_tracker",
    type: "meal",
    title: "Meal Tracker",
    description: "Log 10 meals",
    icon: "🍎",
    unlocked: false,
    progress: 0,
    target: 10,
    rarity: "common",
  },
  {
    id: "nutrition_master",
    type: "meal",
    title: "Nutrition Master",
    description: "Log 50 meals",
    icon: "🥗",
    unlocked: false,
    progress: 0,
    target: 50,
    rarity: "epic",
  },
];

const DEFAULT_STREAKS: Streak[] = [
  { type: "workout", current: 0, longest: 0, lastDate: "" },
  { type: "checkin", current: 0, longest: 0, lastDate: "" },
  { type: "water", current: 0, longest: 0, lastDate: "" },
  { type: "sleep", current: 0, longest: 0, lastDate: "" },
];

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  exerciseReminders: true,
  exerciseTime: "09:00",
  waterReminders: true,
  waterInterval: 2,
  mealReminders: true,
  mealTimes: ["08:00", "12:30", "19:00"],
  checkinReminders: true,
  checkinTime: "20:00",
};

export const [GamificationProvider, useGamification] = createContextHook(() => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [streaks, setStreaks] = useState<Streak[]>(DEFAULT_STREAKS);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [totalPoints, setTotalPoints] = useState<number>(0);

  const gamificationDataQuery = useQuery({
    queryKey: ["gamificationData", user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        return null;
      }
      return loadGamificationDataFromFirebase(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  useEffect(() => {
    if (gamificationDataQuery.data) {
      console.log("Loading gamification data from Firebase", gamificationDataQuery.data);
      setAchievements(gamificationDataQuery.data.achievements);
      setStreaks(gamificationDataQuery.data.streaks);
      setWeeklyGoals(gamificationDataQuery.data.weeklyGoals);
      setNotificationSettings(gamificationDataQuery.data.notificationSettings);
      setTotalPoints(gamificationDataQuery.data.totalPoints);
    } else if (gamificationDataQuery.isFetched && !gamificationDataQuery.data && user?.uid && !gamificationDataQuery.isError) {
      console.log("No gamification data found, initializing defaults");
      syncGamificationDataToFirebase(user.uid, {
        achievements: DEFAULT_ACHIEVEMENTS,
        streaks: DEFAULT_STREAKS,
        weeklyGoals: [],
        notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
        totalPoints: 0,
      }).catch((error) => {
        console.error("Error initializing gamification data:", error);
      });
    }
  }, [gamificationDataQuery.data, gamificationDataQuery.isFetched, gamificationDataQuery.isError, user?.uid]);

  useEffect(() => {
    const setupNotifications = async () => {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission && notificationSettings) {
        if (notificationSettings.exerciseReminders && notificationSettings.exerciseTime) {
          await scheduleExerciseReminder(notificationSettings.exerciseTime);
        }
        if (notificationSettings.waterReminders && notificationSettings.waterInterval) {
          await scheduleWaterReminders(notificationSettings.waterInterval);
        }
        if (notificationSettings.mealReminders && notificationSettings.mealTimes.length > 0) {
          await scheduleMealReminders(notificationSettings.mealTimes);
        }
        if (notificationSettings.checkinReminders && notificationSettings.checkinTime) {
          await scheduleCheckinReminder(notificationSettings.checkinTime);
        }
        console.log("Initial notifications scheduled");
      }
    };

    if (gamificationDataQuery.isFetched && notificationSettings && user?.uid) {
      setupNotifications();
    }
  }, [gamificationDataQuery.isFetched, notificationSettings, user?.uid]);

  useEffect(() => {
    if (!user?.uid || !gamificationDataQuery.isFetched) {
      return;
    }

    let lastUpdateTime = Date.now();
    const MIN_UPDATE_INTERVAL = 1000;

    const unsubscribe = subscribeToUserDocument<{
      achievements: Achievement[];
      streaks: Streak[];
      weeklyGoals: WeeklyGoal[];
      notificationSettings: NotificationSettings;
      totalPoints: number;
    }>(
      user.uid,
      firestoreCollections.gamification,
      (data) => {
        if (data) {
          const now = Date.now();
          if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
            console.log("Skipping gamification update - too soon");
            return;
          }
          
          lastUpdateTime = now;
          console.log("Gamification data updated from Firebase");
          setAchievements(data.achievements);
          setStreaks(data.streaks);
          setWeeklyGoals(data.weeklyGoals);
          setNotificationSettings(data.notificationSettings);
          setTotalPoints(data.totalPoints);
          queryClient.setQueryData(["gamificationData", user.uid], data);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid, queryClient, gamificationDataQuery.isFetched]);



  const checkAchievement = useCallback(
    (achievementId: string, progress: number) => {
      const achievement = achievements.find((a) => a.id === achievementId);
      if (!achievement || achievement.unlocked) {
        return;
      }

      const newProgress = Math.min(progress, achievement.target);
      const justUnlocked = newProgress >= achievement.target && !achievement.unlocked;

      let updatedTotalPoints = totalPoints;

      if (justUnlocked) {
        const points =
          achievement.rarity === "legendary"
            ? 100
            : achievement.rarity === "epic"
              ? 50
              : achievement.rarity === "rare"
                ? 25
                : 10;
        updatedTotalPoints = totalPoints + points;
      }

      const updatedAchievements = achievements.map((a) => {
        if (a.id !== achievementId) {
          return a;
        }

        if (justUnlocked) {
          return {
            ...a,
            unlocked: true,
            progress: a.target,
            unlockedAt: new Date().toISOString(),
          };
        }

        return { ...a, progress: newProgress };
      });

      setAchievements(updatedAchievements);

      if (justUnlocked) {
        setTotalPoints(updatedTotalPoints);
        sendAchievementNotification(achievement.title, achievement.description);
      }

      if (user?.uid) {
        const payload: {
          achievements: Achievement[];
          totalPoints?: number;
        } = {
          achievements: updatedAchievements,
        };

        if (justUnlocked) {
          payload.totalPoints = updatedTotalPoints;
        }

        syncPartialGamificationData(user.uid, payload).catch((error) => {
          console.error("Error syncing achievement update:", error);
        });
      }
    },
    [achievements, totalPoints, user?.uid]
  );

  const updateStreak = useCallback(
    (type: Streak["type"], completed: boolean) => {
      const today = new Date().toISOString().split("T")[0];
      const updated = streaks.map((streak) => {
        if (streak.type === type) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          const isConsecutive = streak.lastDate === yesterday || streak.lastDate === today;

          if (completed && streak.lastDate !== today) {
            const newCurrent = isConsecutive ? streak.current + 1 : 1;
            return {
              ...streak,
              current: newCurrent,
              longest: Math.max(newCurrent, streak.longest),
              lastDate: today,
            };
          }
          if (!completed && !isConsecutive && streak.lastDate !== today) {
            return { ...streak, current: 0 };
          }
        }
        return streak;
      });

      setStreaks(updated);

      if (user?.uid) {
        syncPartialGamificationData(user.uid, {
          streaks: updated,
        }).catch((error) => {
          console.error('Error syncing streak update:', error);
        });
      }

      const workoutStreak = updated.find((s) => s.type === "workout");
      if (workoutStreak) {
        checkAchievement("week_streak", workoutStreak.current);
        checkAchievement("month_streak", workoutStreak.current);
      }
    },
    [streaks, user?.uid, checkAchievement]
  );

  const addWeeklyGoal = useCallback(
    (goal: WeeklyGoal) => {
      const updated = [...weeklyGoals, goal];
      setWeeklyGoals(updated);

      if (user?.uid) {
        syncPartialGamificationData(user.uid, {
          weeklyGoals: updated,
        }).catch((error) => {
          console.error('Error syncing weekly goal:', error);
        });
      }
    },
    [weeklyGoals, user?.uid]
  );

  const updateWeeklyGoalProgress = useCallback(
    (goalId: string, progress: number) => {
      const updated = weeklyGoals.map((goal) =>
        goal.id === goalId ? { ...goal, current: Math.min(progress, goal.target) } : goal
      );
      setWeeklyGoals(updated);

      if (user?.uid) {
        syncPartialGamificationData(user.uid, {
          weeklyGoals: updated,
        }).catch((error) => {
          console.error('Error syncing weekly goal progress:', error);
        });
      }
    },
    [weeklyGoals, user?.uid]
  );

  const updateNotifications = useCallback(
    async (settings: Partial<NotificationSettings>) => {
      const updated = { ...notificationSettings, ...settings };
      setNotificationSettings(updated);

      if (user?.uid) {
        try {
          await syncPartialGamificationData(user.uid, {
            notificationSettings: updated,
          });
        } catch (error) {
          console.error('Error syncing notification settings:', error);
        }
      }

      await cancelAllNotifications();

      if (updated.exerciseReminders && updated.exerciseTime) {
        await scheduleExerciseReminder(updated.exerciseTime);
      }

      if (updated.waterReminders && updated.waterInterval) {
        await scheduleWaterReminders(updated.waterInterval);
      }

      if (updated.mealReminders && updated.mealTimes.length > 0) {
        await scheduleMealReminders(updated.mealTimes);
      }

      if (updated.checkinReminders && updated.checkinTime) {
        await scheduleCheckinReminder(updated.checkinTime);
      }

      console.log("Notifications scheduled successfully");
    },
    [notificationSettings, user?.uid]
  );

  const unlockedAchievements = useMemo(
    () => achievements.filter((a) => a.unlocked),
    [achievements]
  );

  const longestStreak = useMemo(() => Math.max(...streaks.map((s) => s.longest), 0), [streaks]);

  return useMemo(
    () => ({
      achievements,
      streaks,
      weeklyGoals,
      notificationSettings,
      totalPoints,
      unlockedAchievements,
      longestStreak,
      checkAchievement,
      updateStreak,
      addWeeklyGoal,
      updateWeeklyGoalProgress,
      updateNotifications,
      isLoading: gamificationDataQuery.isLoading,
    }),
    [
      achievements,
      streaks,
      weeklyGoals,
      notificationSettings,
      totalPoints,
      unlockedAchievements,
      longestStreak,
      checkAchievement,
      updateStreak,
      addWeeklyGoal,
      updateWeeklyGoalProgress,
      updateNotifications,
      gamificationDataQuery.isLoading,
    ]
  );
});
