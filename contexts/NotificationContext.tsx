import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  scheduleExerciseReminder,
  scheduleWaterReminders,
  scheduleMealReminders,
  scheduleCheckinReminder,
  cancelAllNotifications,
} from "@/utils/notifications";
import { parseNotificationData, handleNotificationNavigation } from "@/utils/deepLinking";

interface NotificationSettings {
  exerciseReminders: boolean;
  exerciseTime: string;
  waterReminders: boolean;
  waterInterval: number;
  mealReminders: boolean;
  mealTimes: string[];
  checkinReminders: boolean;
  checkinTime: string;
  achievementNotifications: boolean;
  streakNotifications: boolean;
  coachingTips: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  exerciseReminders: true,
  exerciseTime: "08:00",
  waterReminders: true,
  waterInterval: 2,
  mealReminders: true,
  mealTimes: ["08:00", "13:00", "19:00"],
  checkinReminders: true,
  checkinTime: "20:00",
  achievementNotifications: true,
  streakNotifications: true,
  coachingTips: true,
};

const STORAGE_KEY = "@notification_settings";

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const { user, isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const registerForPushNotificationsAsync = useCallback(async () => {
    if (Platform.OS === "web") {
      console.log("[Notifications] Push notifications not supported on web");
      return null;
    }

    if (!Device.isDevice) {
      console.log("[Notifications] Must use physical device for push notifications");
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("[Notifications] Permission not granted");
        setIsPermissionGranted(false);
        return null;
      }

      setIsPermissionGranted(true);

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "qzxuq561w88k12yv0byp4",
      });
      
      const token = tokenData.data;
      console.log("[Notifications] Push token obtained:", token);

      if (isAuthenticated && user) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(
          userRef,
          {
            pushTokens: {
              [Platform.OS]: token,
              lastUpdated: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        console.log("[Notifications] Push token saved to Firestore");
      }

      return token;
    } catch (error) {
      console.error("[Notifications] Error registering for push notifications:", error);
      return null;
    }
  }, [isAuthenticated, user]);

  const loadSettings = useCallback(async () => {
    try {
      if (isAuthenticated && user) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && userDoc.data().notificationSettings) {
          const firestoreSettings = userDoc.data().notificationSettings as NotificationSettings;
          setSettings(firestoreSettings);
          console.log("[Notifications] Settings loaded from Firestore");
          return;
        }
      }

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
        console.log("[Notifications] Settings loaded from AsyncStorage");
      }
    } catch (error) {
      console.error("[Notifications] Error loading settings:", error);
    }
  }, [isAuthenticated, user]);

  const saveSettings = useCallback(
    async (newSettings: NotificationSettings) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));

        if (isAuthenticated && user) {
          const userRef = doc(db, "users", user.uid);
          await setDoc(
            userRef,
            {
              notificationSettings: newSettings,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          console.log("[Notifications] Settings saved to Firestore");
        }

        setSettings(newSettings);
        console.log("[Notifications] Settings saved");
      } catch (error) {
        console.error("[Notifications] Error saving settings:", error);
        throw error;
      }
    },
    [isAuthenticated, user]
  );

  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      const newSettings = { ...settings, ...updates };
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  const applyNotificationSchedule = useCallback(async () => {
    if (Platform.OS === "web" || !isPermissionGranted) return;

    try {
      await cancelAllNotifications();

      if (settings.exerciseReminders) {
        await scheduleExerciseReminder(settings.exerciseTime);
      }

      if (settings.waterReminders) {
        await scheduleWaterReminders(settings.waterInterval);
      }

      if (settings.mealReminders) {
        await scheduleMealReminders(settings.mealTimes);
      }

      if (settings.checkinReminders) {
        await scheduleCheckinReminder(settings.checkinTime);
      }

      console.log("[Notifications] Schedule applied successfully");
    } catch (error) {
      console.error("[Notifications] Error applying schedule:", error);
    }
  }, [settings, isPermissionGranted]);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === "web") return false;

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === "granted";
      setIsPermissionGranted(granted);

      if (granted) {
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);
        await applyNotificationSchedule();
      }

      return granted;
    } catch (error) {
      console.error("[Notifications] Error requesting permission:", error);
      return false;
    }
  }, [registerForPushNotificationsAsync, applyNotificationSchedule]);

  const disableAllNotifications = useCallback(async () => {
    try {
      await cancelAllNotifications();
      await updateSettings({
        exerciseReminders: false,
        waterReminders: false,
        mealReminders: false,
        checkinReminders: false,
        achievementNotifications: false,
        streakNotifications: false,
        coachingTips: false,
      });
      console.log("[Notifications] All notifications disabled");
    } catch (error) {
      console.error("[Notifications] Error disabling notifications:", error);
    }
  }, [updateSettings]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      await loadSettings();

      if (Platform.OS !== "web") {
        const { status } = await Notifications.getPermissionsAsync();
        setIsPermissionGranted(status === "granted");

        if (status === "granted") {
          const token = await registerForPushNotificationsAsync();
          setExpoPushToken(token);
        }
      }

      setIsLoading(false);
    };

    initialize();
  }, [loadSettings, registerForPushNotificationsAsync]);

  useEffect(() => {
    if (!isLoading && isPermissionGranted) {
      applyNotificationSchedule();
    }
  }, [settings, isPermissionGranted, isLoading, applyNotificationSchedule]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[Notifications] Notification received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("[Notifications] Notification response:", response);
      const data = response.notification.request.content.data;
      const notificationData = parseNotificationData(data);
      handleNotificationNavigation(notificationData);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return useMemo(
    () => ({
      expoPushToken,
      settings,
      isPermissionGranted,
      isLoading,
      updateSettings,
      saveSettings,
      requestPermission,
      disableAllNotifications,
      applyNotificationSchedule,
    }),
    [
      expoPushToken,
      settings,
      isPermissionGranted,
      isLoading,
      updateSettings,
      saveSettings,
      requestPermission,
      disableAllNotifications,
      applyNotificationSchedule,
    ]
  );
});
