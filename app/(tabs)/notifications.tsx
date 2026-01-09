import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Bell, Clock, Droplet, Utensils, Heart, Trophy, Lightbulb, BellOff } from "lucide-react-native";

import colors from "@/constants/colors";
import { useNotifications } from "@/contexts/NotificationContext";
import * as Haptics from "expo-haptics";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const [hour, minute] = value.split(":");

  const incrementHour = () => {
    const newHour = (parseInt(hour) + 1) % 24;
    onChange(`${newHour.toString().padStart(2, "0")}:${minute}`);
  };

  const decrementHour = () => {
    const newHour = (parseInt(hour) - 1 + 24) % 24;
    onChange(`${newHour.toString().padStart(2, "0")}:${minute}`);
  };

  const incrementMinute = () => {
    const newMinute = (parseInt(minute) + 15) % 60;
    onChange(`${hour}:${newMinute.toString().padStart(2, "0")}`);
  };

  const decrementMinute = () => {
    const newMinute = (parseInt(minute) - 15 + 60) % 60;
    onChange(`${hour}:${newMinute.toString().padStart(2, "0")}`);
  };

  return (
    <View style={styles.timePicker}>
      <View style={styles.timePickerColumn}>
        <TouchableOpacity onPress={incrementHour} style={styles.timeButton}>
          <Text style={styles.timeButtonText}>▲</Text>
        </TouchableOpacity>
        <Text style={styles.timeValue}>{hour}</Text>
        <TouchableOpacity onPress={decrementHour} style={styles.timeButton}>
          <Text style={styles.timeButtonText}>▼</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.timeSeparator}>:</Text>
      <View style={styles.timePickerColumn}>
        <TouchableOpacity onPress={incrementMinute} style={styles.timeButton}>
          <Text style={styles.timeButtonText}>▲</Text>
        </TouchableOpacity>
        <Text style={styles.timeValue}>{minute}</Text>
        <TouchableOpacity onPress={decrementMinute} style={styles.timeButton}>
          <Text style={styles.timeButtonText}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function NotificationsScreen() {
  const { settings, isPermissionGranted, isLoading, updateSettings, requestPermission, disableAllNotifications } =
    useNotifications();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!isPermissionGranted && value) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to use this feature.",
          [{ text: "OK" }]
        );
        return;
      }
    }

    try {
      setIsSaving(true);
      await updateSettings({ [key]: value });
    } catch (error) {
      console.error("Error updating setting:", error);
      Alert.alert("Error", "Failed to update notification settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeChange = async (key: "exerciseTime" | "checkinTime", value: string) => {
    try {
      setIsSaving(true);
      await updateSettings({ [key]: value });
    } catch (error) {
      console.error("Error updating time:", error);
      Alert.alert("Error", "Failed to update notification time");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisableAll = async () => {
    Alert.alert("Disable All Notifications", "Are you sure you want to disable all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disable All",
        style: "destructive",
        onPress: async () => {
          try {
            setIsSaving(true);
            await disableAllNotifications();
            Alert.alert("Success", "All notifications have been disabled");
          } catch (error) {
            console.error("Error disabling notifications:", error);
            Alert.alert("Error", "Failed to disable notifications");
          } finally {
            setIsSaving(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Notifications", headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Bell size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Notifications", headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Bell size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!isPermissionGranted && Platform.OS !== "web" && (
          <View style={styles.permissionBanner}>
            <Bell size={20} color={colors.warning} />
            <Text style={styles.permissionText}>Notifications are disabled. Enable them to receive reminders.</Text>
            <TouchableOpacity style={styles.enableButton} onPress={requestPermission}>
              <Text style={styles.enableButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Reminders</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Clock size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Exercise Reminders</Text>
                <Text style={styles.settingDescription}>Get reminded to exercise daily</Text>
              </View>
            </View>
            <Switch
              value={settings.exerciseReminders}
              onValueChange={(value) => handleToggle("exerciseReminders", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              disabled={isSaving}
            />
          </View>

          {settings.exerciseReminders && (
            <View style={styles.timePickerContainer}>
              <Text style={styles.timeLabel}>Exercise Time</Text>
              <TimePicker value={settings.exerciseTime} onChange={(time) => handleTimeChange("exerciseTime", time)} />
            </View>
          )}

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Droplet size={20} color={colors.secondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Water Reminders</Text>
                <Text style={styles.settingDescription}>Stay hydrated throughout the day</Text>
              </View>
            </View>
            <Switch
              value={settings.waterReminders}
              onValueChange={(value) => handleToggle("waterReminders", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              disabled={isSaving}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Utensils size={20} color={colors.accent} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Meal Reminders</Text>
                <Text style={styles.settingDescription}>Get reminded to log your meals</Text>
              </View>
            </View>
            <Switch
              value={settings.mealReminders}
              onValueChange={(value) => handleToggle("mealReminders", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              disabled={isSaving}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Heart size={20} color="#FF6B9D" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Wellness Check-in</Text>
                <Text style={styles.settingDescription}>Daily wellness reflection</Text>
              </View>
            </View>
            <Switch
              value={settings.checkinReminders}
              onValueChange={(value) => handleToggle("checkinReminders", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              disabled={isSaving}
            />
          </View>

          {settings.checkinReminders && (
            <View style={styles.timePickerContainer}>
              <Text style={styles.timeLabel}>Check-in Time</Text>
              <TimePicker value={settings.checkinTime} onChange={(time) => handleTimeChange("checkinTime", time)} />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Trophy size={20} color="#FFD700" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Achievement Unlocked</Text>
                <Text style={styles.settingDescription}>Celebrate your milestones</Text>
              </View>
            </View>
            <Switch
              value={settings.achievementNotifications}
              onValueChange={(value) => handleToggle("achievementNotifications", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              disabled={isSaving}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.streakIcon}>🔥</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Streak Notifications</Text>
                <Text style={styles.settingDescription}>Stay motivated with streaks</Text>
              </View>
            </View>
            <Switch
              value={settings.streakNotifications}
              onValueChange={(value) => handleToggle("streakNotifications", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              disabled={isSaving}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Lightbulb size={20} color="#FFA500" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Coaching Tips</Text>
                <Text style={styles.settingDescription}>Helpful wellness insights</Text>
              </View>
            </View>
            <Switch
              value={settings.coachingTips}
              onValueChange={(value) => handleToggle("coachingTips", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              disabled={isSaving}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.disableAllButton} onPress={handleDisableAll} disabled={isSaving}>
          <BellOff size={20} color={colors.error} />
          <Text style={styles.disableAllText}>Disable All Notifications</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Notifications help you stay on track with your wellness goals. You can customize them anytime.
          </Text>
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  permissionBanner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#FFF3CD",
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  permissionText: {
    flex: 1,
    fontSize: 14,
    color: "#856404",
    marginLeft: 12,
  },
  enableButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enableButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginBottom: 16,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  streakIcon: {
    fontSize: 20,
  },
  timePickerContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginLeft: 12,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  timePicker: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  timePickerColumn: {
    alignItems: "center" as const,
  },
  timeButton: {
    padding: 8,
  },
  timeButtonText: {
    fontSize: 20,
    color: colors.primary,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.text,
    marginVertical: 8,
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.text,
    marginHorizontal: 16,
  },
  disableAllButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.error,
  },
  disableAllText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.error,
    marginLeft: 8,
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "center" as const,
    lineHeight: 20,
  },
});
