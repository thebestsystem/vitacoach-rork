import { Award, Flame, Target, TrendingUp, Bell, BellOff } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import colors from "@/constants/colors";
import { useGamification } from "@/contexts/GamificationContext";
import type { Achievement } from "@/types/health";

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const {
    achievements,
    streaks,
    weeklyGoals,
    totalPoints,
    unlockedAchievements,
    longestStreak,
    notificationSettings,
    updateNotifications,
  } = useGamification();

  const [showSettings, setShowSettings] = useState<boolean>(false);

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return "#FFD700";
      case "epic":
        return "#9B59B6";
      case "rare":
        return "#3498DB";
      default:
        return colors.textSecondary;
    }
  };

  const getRarityLabel = (rarity: Achievement["rarity"]) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const currentStreak = streaks.find(s => s.type === "workout");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Achievements</Text>
          <TouchableOpacity
            onPress={() => setShowSettings(!showSettings)}
            style={styles.settingsButton}
          >
            {showSettings ? (
              <BellOff size={24} color={colors.primary} strokeWidth={2} />
            ) : (
              <Bell size={24} color={colors.primary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        {showSettings && (
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Notification Settings</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Exercise Reminders</Text>
                <Text style={styles.settingDescription}>Daily workout notifications</Text>
              </View>
              <Switch
                value={notificationSettings.exerciseReminders}
                onValueChange={(value) => updateNotifications({ exerciseReminders: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Water Reminders</Text>
                <Text style={styles.settingDescription}>Stay hydrated throughout the day</Text>
              </View>
              <Switch
                value={notificationSettings.waterReminders}
                onValueChange={(value) => updateNotifications({ waterReminders: value })}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={colors.surface}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Meal Reminders</Text>
                <Text style={styles.settingDescription}>Log your meals on time</Text>
              </View>
              <Switch
                value={notificationSettings.mealReminders}
                onValueChange={(value) => updateNotifications({ mealReminders: value })}
                trackColor={{ false: colors.border, true: colors.warning }}
                thumbColor={colors.surface}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Wellness Check-ins</Text>
                <Text style={styles.settingDescription}>Daily mindfulness reminders</Text>
              </View>
              <Switch
                value={notificationSettings.checkinReminders}
                onValueChange={(value) => updateNotifications({ checkinReminders: value })}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.surface}
              />
            </View>

            {Platform.OS === "web" && (
              <Text style={styles.webNote}>
                Note: Notifications are not supported on web. Use mobile for full notification experience.
              </Text>
            )}
          </View>
        )}

        <View style={styles.statsRow}>
          <LinearGradient
            colors={[colors.gradient1[0], colors.gradient1[1]] as readonly [string, string, ...string[]]}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Award size={32} color={colors.surface} strokeWidth={2} />
            <Text style={styles.statValue}>{unlockedAchievements.length}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </LinearGradient>

          <LinearGradient
            colors={[colors.gradient2[0], colors.gradient2[1]] as readonly [string, string, ...string[]]}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Flame size={32} color={colors.surface} strokeWidth={2} />
            <Text style={styles.statValue}>{currentStreak?.current || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </LinearGradient>

          <View style={styles.statCard}>
            <TrendingUp size={32} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.statValue, { color: colors.text }]}>{totalPoints}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points</Text>
          </View>
        </View>

        {longestStreak > 0 && (
          <View style={styles.streakCard}>
            <View style={styles.streakIcon}>
              <Flame size={24} color={colors.warning} strokeWidth={2} />
            </View>
            <View style={styles.streakContent}>
              <Text style={styles.streakTitle}>Longest Streak</Text>
              <Text style={styles.streakDays}>{longestStreak} days</Text>
            </View>
            <Text style={styles.streakEmoji}>🔥</Text>
          </View>
        )}

        {weeklyGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Goals</Text>
            {weeklyGoals.map((goal) => (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Target size={20} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                </View>
                <View style={styles.goalProgress}>
                  <View style={styles.goalProgressBar}>
                    <View
                      style={[
                        styles.goalProgressFill,
                        { width: `${(goal.current / goal.target) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.goalProgressText}>
                    {goal.current} / {goal.target}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  achievement.unlocked && styles.achievementUnlocked,
                ]}
              >
                <View style={styles.achievementHeader}>
                  <Text
                    style={[
                      styles.achievementIcon,
                      !achievement.unlocked && styles.achievementIconLocked,
                    ]}
                  >
                    {achievement.icon}
                  </Text>
                  <View
                    style={[
                      styles.rarityBadge,
                      { backgroundColor: getRarityColor(achievement.rarity) },
                    ]}
                  >
                    <Text style={styles.rarityText}>{getRarityLabel(achievement.rarity)}</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.achievementTextLocked,
                  ]}
                >
                  {achievement.title}
                </Text>
                <Text
                  style={[
                    styles.achievementDescription,
                    !achievement.unlocked && styles.achievementTextLocked,
                  ]}
                >
                  {achievement.description}
                </Text>
                {!achievement.unlocked && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${(achievement.progress / achievement.target) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {achievement.progress} / {achievement.target}
                    </Text>
                  </View>
                )}
                {achievement.unlocked && achievement.unlockedAt && (
                  <Text style={styles.unlockedDate}>
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.text,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  webNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
    fontStyle: "italic" as const,
  },
  statsRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.surface,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.surface,
    fontWeight: "600" as const,
    opacity: 0.9,
  },
  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 16,
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 4,
  },
  streakDays: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  streakEmoji: {
    fontSize: 48,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  goalProgress: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  goalProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  goalProgressFill: {
    height: "100%" as const,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  goalProgressText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  achievementsGrid: {
    gap: 12,
  },
  achievementCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    opacity: 0.6,
  },
  achievementUnlocked: {
    opacity: 1,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  achievementHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  achievementIcon: {
    fontSize: 48,
  },
  achievementIconLocked: {
    opacity: 0.5,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.surface,
    textTransform: "uppercase" as const,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  achievementTextLocked: {
    opacity: 0.6,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: "hidden" as const,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%" as const,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600" as const,
  },
  unlockedDate: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600" as const,
    marginTop: 8,
  },
});
