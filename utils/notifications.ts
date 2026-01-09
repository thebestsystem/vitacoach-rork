import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    console.log("Notifications not supported on web");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === "granted";
}

export async function scheduleExerciseReminder(time: string): Promise<void> {
  if (Platform.OS === "web") return;

  const [hours, minutes] = time.split(":").map(Number);
  
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to Move! 💪",
      body: "Your daily workout is waiting. Let's get active!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: hours,
      minute: minutes,
      repeats: true,
    },
  });
  
  console.log(`Scheduled exercise reminder at ${time}`);
}

export async function scheduleWaterReminders(intervalHours: number): Promise<void> {
  if (Platform.OS === "web") return;

  const notifications = [
    { hour: 9, minute: 0, body: "Time to hydrate! 💧 Stay refreshed throughout the day." },
    { hour: 11, minute: 0, body: "Drink some water! 💧 Keep your body hydrated." },
    { hour: 14, minute: 0, body: "Hydration check! 💧 Your body needs water." },
    { hour: 16, minute: 0, body: "Water break! 💧 Stay hydrated and energized." },
    { hour: 18, minute: 0, body: "Evening hydration! 💧 Don't forget to drink water." },
  ];

  for (const notification of notifications) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hydration Reminder",
        body: notification.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: notification.hour,
        minute: notification.minute,
        repeats: true,
      },
    });
  }
  
  console.log("Scheduled water reminders");
}

export async function scheduleMealReminders(mealTimes: string[]): Promise<void> {
  if (Platform.OS === "web") return;

  const mealTypes = ["Breakfast", "Lunch", "Dinner"];
  
  for (let i = 0; i < mealTimes.length && i < mealTypes.length; i++) {
    const [hours, minutes] = mealTimes[i].split(":").map(Number);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${mealTypes[i]} Time! 🍎`,
        body: `Don't forget to log your ${mealTypes[i].toLowerCase()} for tracking.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }
  
  console.log("Scheduled meal reminders");
}

export async function scheduleCheckinReminder(time: string): Promise<void> {
  if (Platform.OS === "web") return;

  const [hours, minutes] = time.split(":").map(Number);
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Wellness Check-In 🧘",
      body: "Take a moment to reflect on your day and check in with yourself.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: hours,
      minute: minutes,
      repeats: true,
    },
  });
  
  console.log(`Scheduled check-in reminder at ${time}`);
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log("Cancelled all notifications");
}

export async function sendAchievementNotification(title: string, description: string): Promise<void> {
  if (Platform.OS === "web") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎉 Achievement Unlocked!`,
      body: `${title}: ${description}`,
      sound: true,
    },
    trigger: null,
  });
}

export async function sendStreakNotification(streakType: string, days: number): Promise<void> {
  if (Platform.OS === "web") return;

  const emoji = streakType === "workout" ? "🔥" : streakType === "water" ? "💧" : streakType === "sleep" ? "🌙" : "🧘";
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} Streak Milestone!`,
      body: `You've maintained your ${streakType} streak for ${days} days! Keep it up!`,
      sound: true,
    },
    trigger: null,
  });
}
