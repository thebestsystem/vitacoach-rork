import { Trophy, Users, Calendar, TrendingUp, Plus, ChevronRight, Medal, Flame, Droplet, Footprints, Moon, X, Target } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import colors from "@/constants/colors";
import { useHealth } from "@/contexts/HealthContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { lightImpact, selectionFeedback, successFeedback, errorFeedback } from "@/utils/haptics";
import type { Challenge, LeaderboardEntry } from "@/types/health";
import { useChallengeStore } from "@/stores/challengeStore";

// Removed MOCK_LEADERBOARD in favor of store.leaderboard

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { healthMetrics, exerciseLogs } = useHealth();
  const { totalPoints, unlockedAchievements } = useGamification();
  const { challenges, leaderboard, fetchChallenges, createChallenge, joinChallenge, fetchLeaderboard, isLoading } = useChallengeStore();
  
  const [selectedTab, setSelectedTab] = useState<"active" | "leaderboard">("active");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState<boolean>(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState("");
  const [newChallengeDescription, setNewChallengeDescription] = useState("");
  const [newChallengeType, setNewChallengeType] = useState<Challenge['type']>("steps");
  const [newChallengeGoal, setNewChallengeGoal] = useState("10000");
  const [newChallengeDuration, setNewChallengeDuration] = useState("7");

  useEffect(() => {
    fetchChallenges();
  }, []);

  useEffect(() => {
      if (selectedTab === 'leaderboard') {
          fetchLeaderboard();
      }
  }, [selectedTab]);

  const handleChallengePress = (challenge: Challenge) => {
    selectionFeedback();
    setSelectedChallenge(challenge);
    setShowChallengeDetail(true);
  };

  const handleJoinChallenge = async () => {
    if (!selectedChallenge || !user) return;

    // Check if already joined
    const isParticipant = selectedChallenge.participants.some(p => p.userId === user.uid);
    if (isParticipant) {
        Alert.alert("Already Joined", "You are already participating in this challenge!");
        return;
    }

    try {
        await joinChallenge(selectedChallenge.id, { uid: user.uid, displayName: user.displayName || 'You' });
        successFeedback();
        setShowChallengeDetail(false);
        Alert.alert("Success", "You have joined the challenge!");
    } catch (error) {
        errorFeedback();
        Alert.alert("Error", "Failed to join challenge. Please try again.");
    }
  };

  const handleCreateChallenge = async () => {
      if (!newChallengeTitle || !newChallengeGoal || !newChallengeDuration) {
          errorFeedback();
          Alert.alert("Error", "Please fill in all required fields.");
          return;
      }

      if (!user) {
          errorFeedback();
          Alert.alert("Error", "You must be logged in to create a challenge.");
          return;
      }

      const durationDays = parseInt(newChallengeDuration, 10);
      const goalValue = parseInt(newChallengeGoal, 10);

      if (isNaN(durationDays) || isNaN(goalValue)) {
          errorFeedback();
          Alert.alert("Error", "Goal and duration must be numbers.");
          return;
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const challengeData: Omit<Challenge, 'id'> = {
          title: newChallengeTitle,
          description: newChallengeDescription || `Reach ${goalValue} ${newChallengeType}`,
          type: newChallengeType,
          goal: goalValue,
          startDate: new Date().toISOString(),
          endDate: endDate.toISOString(),
          participants: [{
              userId: user.uid,
              userName: user.displayName || 'You',
              progress: 0,
              joinedAt: new Date().toISOString(),
              rank: 1
          }],
          createdBy: user.uid,
          icon: getEmojiForType(newChallengeType),
          prize: "🏆 Badge",
      };

      try {
          await createChallenge(challengeData);
          successFeedback();
          setShowCreateModal(false);
          // Reset form
          setNewChallengeTitle("");
          setNewChallengeDescription("");
          setNewChallengeGoal("10000");
          setNewChallengeDuration("7");
      } catch (error) {
          errorFeedback();
          Alert.alert("Error", "Failed to create challenge.");
      }
  };

  const getEmojiForType = (type: Challenge["type"]) => {
      switch(type) {
          case 'steps': return '👟';
          case 'water': return '💧';
          case 'sleep': return '🌙';
          case 'workouts': return '💪';
          case 'calories': return '🔥';
          default: return '🏆';
      }
  };

  const getChallengeIcon = (type: Challenge["type"]) => {
    switch (type) {
      case "steps":
        return <Footprints size={20} color={colors.primary} strokeWidth={2} />;
      case "water":
        return <Droplet size={20} color={colors.secondary} strokeWidth={2} />;
      case "sleep":
        return <Moon size={20} color={colors.primaryLight} strokeWidth={2} />;
      case "workouts":
        return <Flame size={20} color={colors.warning} strokeWidth={2} />;
      case "calories":
        return <Flame size={20} color={colors.error} strokeWidth={2} />;
    }
  };

  const userWeeklyWorkouts = exerciseLogs.filter(
    log => new Date(log.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

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
          <Text style={styles.headerTitle}>Challenges</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              lightImpact();
              setShowCreateModal(true);
            }}
          >
            <Plus size={24} color={colors.surface} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "active" && styles.tabActive]}
            onPress={() => {
              selectionFeedback();
              setSelectedTab("active");
            }}
          >
            <Trophy size={18} color={selectedTab === "active" ? colors.surface : colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.tabText, selectedTab === "active" && styles.tabTextActive]}>
              Active Challenges
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === "leaderboard" && styles.tabActive]}
            onPress={() => {
              selectionFeedback();
              setSelectedTab("leaderboard");
            }}
          >
            <Medal size={18} color={selectedTab === "leaderboard" ? colors.surface : colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.tabText, selectedTab === "leaderboard" && styles.tabTextActive]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === "active" && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading && challenges.length === 0 ? (
                <View style={{ padding: 20 }}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : (
                <View style={styles.challengesList}>
                {challenges.map((challenge) => {
                    const userParticipant = challenge.participants.find(p => p.userId === user?.uid);
                    const progressPercent = userParticipant ? (userParticipant.progress / challenge.goal) * 100 : 0;
                    const daysLeft = Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                    return (
                    <TouchableOpacity
                        key={challenge.id}
                        style={styles.challengeCard}
                        onPress={() => handleChallengePress(challenge)}
                    >
                        <View style={styles.challengeHeader}>
                        <View style={styles.challengeIconContainer}>
                            <Text style={styles.challengeEmoji}>{challenge.icon}</Text>
                        </View>
                        <View style={styles.challengeInfo}>
                            <Text style={styles.challengeTitle}>{challenge.title}</Text>
                            <Text style={styles.challengeDescription}>{challenge.description}</Text>
                        </View>
                        <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
                        </View>

                        <View style={styles.challengeProgress}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
                        </View>
                        <Text style={styles.progressText}>
                            {userParticipant ? Math.round(progressPercent) : 0}% complete
                        </Text>
                        </View>

                        <View style={styles.challengeMeta}>
                        <View style={styles.metaItem}>
                            <Users size={14} color={colors.textSecondary} strokeWidth={2} />
                            <Text style={styles.metaText}>{challenge.participants.length} joined</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Calendar size={14} color={colors.textSecondary} strokeWidth={2} />
                            <Text style={styles.metaText}>{Math.max(0, daysLeft)} days left</Text>
                        </View>
                        {challenge.prize && (
                            <View style={styles.metaItem}>
                            <Trophy size={14} color={colors.warning} strokeWidth={2} />
                            <Text style={[styles.metaText, { color: colors.warning }]}>{challenge.prize}</Text>
                            </View>
                        )}
                        </View>

                        {userParticipant && userParticipant.rank && (
                        <View style={styles.rankBadge}>
                            <Medal size={16} color={colors.surface} strokeWidth={2} />
                            <Text style={styles.rankText}>#{userParticipant.rank}</Text>
                        </View>
                        )}
                    </TouchableOpacity>
                    );
                })}
                {challenges.length === 0 && (
                    <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>
                        No active challenges. Create one!
                    </Text>
                )}
                </View>
            )}

            <TouchableOpacity style={styles.createButton} onPress={() => {
                lightImpact();
                setShowCreateModal(true);
            }}>
              <LinearGradient
                colors={[colors.gradient2[0], colors.gradient2[1]] as readonly [string, string, ...string[]]}
                style={styles.createButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Plus size={24} color={colors.surface} strokeWidth={2.5} />
                <Text style={styles.createButtonText}>Create New Challenge</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        )}

        {selectedTab === "leaderboard" && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.myStatsCard}>
              <Text style={styles.myStatsTitle}>Your Stats</Text>
              <View style={styles.myStatsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalPoints}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>#{leaderboard.find(e => e.userId === user?.uid)?.rank || "-"}</Text>
                  <Text style={styles.statLabel}>Rank</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{unlockedAchievements.length}</Text>
                  <Text style={styles.statLabel}>Achievements</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userWeeklyWorkouts}</Text>
                  <Text style={styles.statLabel}>This Week</Text>
                </View>
              </View>
            </View>

            <View style={styles.leaderboardList}>
              <Text style={styles.sectionTitle}>Global Leaderboard</Text>
              {leaderboard.length === 0 && !isLoading && (
                   <Text style={{ textAlign: 'center', color: colors.textSecondary }}>No data yet.</Text>
              )}
              {leaderboard.map((entry, index) => {
                const isUser = entry.userId === user?.uid;
                const medalColor = index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : colors.textTertiary;

                return (
                  <View key={entry.userId} style={[styles.leaderboardCard, isUser && styles.leaderboardCardUser]}>
                    <View style={styles.leaderboardRank}>
                      {index < 3 ? (
                        <Medal size={24} color={medalColor} strokeWidth={2} fill={medalColor} />
                      ) : (
                        <Text style={styles.rankNumber}>{entry.rank}</Text>
                      )}
                    </View>

                    <View style={styles.leaderboardAvatar}>
                      <Text style={styles.avatarText}>{entry.userName.charAt(0)}</Text>
                    </View>

                    <View style={styles.leaderboardInfo}>
                      <View style={styles.leaderboardNameRow}>
                        <Text style={[styles.leaderboardName, isUser && styles.leaderboardNameUser]}>
                          {entry.userName}
                        </Text>
                        {entry.trend === "up" && <TrendingUp size={14} color={colors.success} strokeWidth={2} />}
                        {entry.trend === "down" && <TrendingUp size={14} color={colors.error} strokeWidth={2} style={{ transform: [{ rotate: "180deg" }] }} />}
                      </View>
                      <View style={styles.leaderboardStats}>
                        <Text style={styles.leaderboardStat}>{entry.achievements} achievements</Text>
                        <Text style={styles.leaderboardStatDot}>•</Text>
                        <Text style={styles.leaderboardStat}>{entry.weeklyWorkouts} workouts</Text>
                      </View>
                    </View>

                    <View style={styles.leaderboardScore}>
                      <Text style={[styles.scoreValue, isUser && styles.scoreValueUser]}>{entry.score.toLocaleString()}</Text>
                      <Text style={styles.scoreLabel}>pts</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Challenge Detail Modal */}
        <Modal visible={showChallengeDetail} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              {selectedChallenge && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalEmoji}>{selectedChallenge.icon}</Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => {
                        lightImpact();
                        setShowChallengeDetail(false);
                      }}
                    >
                      <X size={24} color={colors.text} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalTitle}>{selectedChallenge.title}</Text>
                  <Text style={styles.modalDescription}>{selectedChallenge.description}</Text>

                  <View style={styles.modalInfo}>
                    <View style={styles.modalInfoItem}>
                      {getChallengeIcon(selectedChallenge.type)}
                      <Text style={styles.modalInfoText}>Goal: {selectedChallenge.goal.toLocaleString()}</Text>
                    </View>
                    <View style={styles.modalInfoItem}>
                      <Calendar size={16} color={colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.modalInfoText}>
                        {Math.ceil((new Date(selectedChallenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                      </Text>
                    </View>
                  </View>

                  <View style={styles.participantsList}>
                    <Text style={styles.participantsTitle}>Participants ({selectedChallenge.participants.length})</Text>
                    {selectedChallenge.participants.slice(0, 5).map((participant, index) => {
                      const progressPercent = (participant.progress / selectedChallenge.goal) * 100;
                      
                      return (
                        <View key={participant.userId} style={styles.participantCard}>
                          <View style={styles.participantRank}>
                            <Text style={styles.participantRankText}>#{index + 1}</Text>
                          </View>
                          <View style={styles.participantAvatar}>
                            <Text style={styles.participantAvatarText}>{participant.userName.charAt(0)}</Text>
                          </View>
                          <View style={styles.participantInfo}>
                            <Text style={styles.participantName}>{participant.userName}</Text>
                            <View style={styles.participantProgressBar}>
                              <View style={[styles.participantProgressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
                            </View>
                          </View>
                          <Text style={styles.participantProgress}>{Math.round(progressPercent)}%</Text>
                        </View>
                      );
                    })}
                  </View>

                  {!selectedChallenge.participants.some(p => p.userId === user?.uid) && (
                    <TouchableOpacity style={styles.joinButton} onPress={handleJoinChallenge}>
                        {isLoading ? (
                             <ActivityIndicator color={colors.surface} />
                        ) : (
                            <Text style={styles.joinButtonText}>Join Challenge</Text>
                        )}
                    </TouchableOpacity>
                  )}
                  {selectedChallenge.participants.some(p => p.userId === user?.uid) && (
                      <View style={[styles.joinButton, { backgroundColor: colors.success }]}>
                           <Text style={styles.joinButtonText}>Joined ✓</Text>
                      </View>
                  )}
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Create Challenge Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Create Challenge</Text>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => {
                                lightImpact();
                                setShowCreateModal(false);
                            }}
                        >
                            <X size={24} color={colors.text} strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 400 }}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 30 Day Walking Challenge"
                            placeholderTextColor={colors.textTertiary}
                            value={newChallengeTitle}
                            onChangeText={setNewChallengeTitle}
                        />

                        <Text style={styles.label}>Type</Text>
                        <View style={styles.typeSelector}>
                            {(['steps', 'water', 'sleep', 'workouts', 'calories'] as const).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeButton, newChallengeType === type && styles.typeButtonActive]}
                                    onPress={() => setNewChallengeType(type)}
                                >
                                    <Text style={[styles.typeButtonText, newChallengeType === type && styles.typeButtonTextActive]}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Goal Target</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 10000"
                            keyboardType="numeric"
                            placeholderTextColor={colors.textTertiary}
                            value={newChallengeGoal}
                            onChangeText={setNewChallengeGoal}
                        />

                        <Text style={styles.label}>Duration (Days)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 7"
                            keyboardType="numeric"
                            placeholderTextColor={colors.textTertiary}
                            value={newChallengeDuration}
                            onChangeText={setNewChallengeDuration}
                        />

                         <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="Describe your challenge..."
                            multiline
                            placeholderTextColor={colors.textTertiary}
                            value={newChallengeDescription}
                            onChangeText={setNewChallengeDescription}
                        />
                    </ScrollView>

                    <TouchableOpacity style={styles.joinButton} onPress={handleCreateChallenge}>
                        {isLoading ? (
                             <ActivityIndicator color={colors.surface} />
                        ) : (
                            <Text style={styles.joinButtonText}>Create Challenge</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  tabSelector: {
    flexDirection: "row" as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  challengesList: {
    gap: 16,
  },
  challengeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative" as const,
  },
  challengeHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  challengeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  challengeEmoji: {
    fontSize: 24,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  challengeProgress: {
    marginBottom: 12,
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
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  challengeMeta: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  metaItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  rankBadge: {
    position: "absolute" as const,
    top: 16,
    right: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.surface,
  },
  createButton: {
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden" as const,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonGradient: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 16,
    gap: 12,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: colors.surface,
  },
  myStatsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  myStatsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 16,
  },
  myStatsGrid: {
    flexDirection: "row" as const,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center" as const,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  leaderboardList: {
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 16,
  },
  leaderboardCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  leaderboardCardUser: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + "10",
  },
  leaderboardRank: {
    width: 32,
    alignItems: "center" as const,
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.textSecondary,
  },
  leaderboardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.surface,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardNameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 4,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  leaderboardNameUser: {
    fontWeight: "700" as const,
    color: colors.primary,
  },
  leaderboardStats: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  leaderboardStat: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  leaderboardStatDot: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  leaderboardScore: {
    alignItems: "flex-end" as const,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
  },
  scoreValueUser: {
    color: colors.primary,
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%" as const,
  },
  modalHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 16,
  },
  modalEmoji: {
    fontSize: 48,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalInfo: {
    flexDirection: "row" as const,
    gap: 16,
    marginBottom: 24,
  },
  modalInfoItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  participantsList: {
    marginBottom: 20,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 12,
  },
  participantCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  participantRank: {
    width: 24,
    marginRight: 12,
  },
  participantRankText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: colors.textSecondary,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  participantAvatarText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: colors.surface,
  },
  participantInfo: {
    flex: 1,
    marginRight: 12,
  },
  participantName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 4,
  },
  participantProgressBar: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: "hidden" as const,
  },
  participantProgressFill: {
    height: "100%" as const,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  participantProgress: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center" as const,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 20
  },
  joinButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: colors.surface,
  },
  label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 12
  },
  input: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      color: colors.text,
      fontSize: 16
  },
  typeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
  },
  typeButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border
  },
  typeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
  },
  typeButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '500'
  },
  typeButtonTextActive: {
      color: colors.surface
  }
});
