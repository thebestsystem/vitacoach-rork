import { User, Target, Heart, TrendingUp, Award, Flame, LogOut, Edit2 } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import colors from "@/constants/colors";
import { useHealth } from "@/contexts/HealthContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProfile, workoutPlans, mealPlans, wellnessCheckIns, saveProfile } = useHealth();
  const { unlockedAchievements, totalPoints, longestStreak } = useGamification();
  const { signOut, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.name || "");
  const [editAge, setEditAge] = useState(userProfile?.age?.toString() || "");
  const [isHormonalEnabled, setIsHormonalEnabled] = useState(!!userProfile?.menstrualCycle);
  const [cycleLength, setCycleLength] = useState(userProfile?.menstrualCycle?.cycleLength?.toString() || "28");
  const [lastPeriod, setLastPeriod] = useState(userProfile?.menstrualCycle?.lastPeriodStart || "");

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    try {
      await saveProfile({
        ...userProfile,
        name: editName,
        age: parseInt(editAge) || userProfile.age,
        menstrualCycle: isHormonalEnabled ? {
            lastPeriodStart: lastPeriod || new Date().toISOString(),
            cycleLength: parseInt(cycleLength) || 28,
            phase: 'follicular' // simplified for now
        } : undefined
      });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (err) {
      console.error("Profile update error:", err);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/auth/login" as any);
            } catch (error) {
              console.error("Sign out error:", error);
              Alert.alert("Error", "Failed to sign out");
            }
          },
        },
      ]
    );
  };

  const stats = [
    { icon: Target, label: "Workout Plans", value: workoutPlans.length, color: colors.primary },
    { icon: Heart, label: "Meal Plans", value: mealPlans.length, color: colors.secondary },
    { icon: TrendingUp, label: "Check-ins", value: wellnessCheckIns.length, color: colors.accent },
    { icon: Award, label: "Achievements", value: unlockedAchievements.length, color: "#FFD700" },
    { icon: Flame, label: "Longest Streak", value: longestStreak, color: colors.warning },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={48} color={colors.primary} strokeWidth={2} />
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setEditName(userProfile?.name || "");
                setEditAge(userProfile?.age?.toString() || "");
                setIsHormonalEnabled(!!userProfile?.menstrualCycle);
                setCycleLength(userProfile?.menstrualCycle?.cycleLength?.toString() || "28");
                setLastPeriod(userProfile?.menstrualCycle?.lastPeriodStart || new Date().toISOString().split('T')[0]);
                setIsEditing(true);
              }}
            >
              <Edit2 size={16} color={colors.surface} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{userProfile?.name || "Wellness Seeker"}</Text>
          {userProfile?.age && (
            <Text style={styles.age}>{userProfile.age} years old</Text>
          )}
          {user?.email && (
            <Text style={styles.email}>{user.email}</Text>
          )}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={18} color={colors.warning} strokeWidth={2} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pointsCard}>
          <Text style={styles.pointsValue}>{totalPoints}</Text>
          <Text style={styles.pointsLabel}>Total Points</Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                  <IconComponent size={24} color={stat.color} strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        {unlockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Achievements</Text>
            <View style={styles.achievementsContainer}>
              {unlockedAchievements.slice(0, 6).map((achievement) => (
                <View key={achievement.id} style={styles.achievementBadge}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={styles.achievementName}>{achievement.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {userProfile?.menstrualCycle && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hormonal Cycle</Text>
                <View style={styles.infoCard}>
                    <Text style={styles.infoValue}>Cycle Syncing Active</Text>
                    <Text style={styles.aboutText}>
                        Cycle Length: {userProfile.menstrualCycle.cycleLength} days
                    </Text>
                </View>
            </View>
        )}

        {userProfile?.goals && userProfile.goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            <View style={styles.goalsContainer}>
              {userProfile.goals.map((goal, index) => (
                <View key={index} style={styles.goalChip}>
                  <Text style={styles.goalText}>{goal.replace(/_/g, " ")}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {userProfile?.fitnessLevel && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Level</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>
                {userProfile.fitnessLevel.charAt(0).toUpperCase() + userProfile.fitnessLevel.slice(1)}
              </Text>
            </View>
          </View>
        )}



        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <Text style={styles.aboutText}>
              This AI-powered wellness coach app helps you achieve your health goals through personalized
              workout plans, nutrition guidance, and mental wellness support. Your journey to a healthier
              you starts here.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={editAge}
                onChangeText={setEditAge}
                keyboardType="numeric"
                placeholder="Enter your age"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {userProfile?.gender === 'female' && (
                <>
                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setIsHormonalEnabled(!isHormonalEnabled)}
                    >
                        <View style={[styles.checkbox, isHormonalEnabled && styles.checkboxChecked]} />
                        <Text style={styles.inputLabel}>Enable Cycle Syncing</Text>
                    </TouchableOpacity>

                    {isHormonalEnabled && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Cycle Length (days)</Text>
                            <TextInput
                                style={styles.input}
                                value={cycleLength}
                                onChangeText={setCycleLength}
                                keyboardType="numeric"
                                placeholder="28"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>
                    )}
                </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: "center" as const,
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    position: "relative" as const,
  },
  editButton: {
    position: "absolute" as const,
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  name: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  age: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  email: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 4,
  },
  signOutButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.warning,
  },
  statsGrid: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 12,
  },
  goalsContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  goalChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goalText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.surface,
    textTransform: "capitalize" as const,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    textTransform: "capitalize" as const,
  },
  aboutText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  pointsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center" as const,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: "700" as const,
    color: colors.primary,
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  achievementsContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  achievementBadge: {
    width: "30%" as const,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: colors.text,
    textAlign: "center" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%" as const,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 20,
    textAlign: "center" as const,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  modalButtons: {
    flexDirection: "row" as const,
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.surface,
  },
});
