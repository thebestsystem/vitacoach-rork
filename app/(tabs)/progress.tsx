import { TrendingUp, Award, Flame, Target, Calendar, Trophy, ChevronRight, BarChart2 } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import colors from "@/constants/colors";
import { useHealth } from "@/contexts/HealthContext";
import { useGamification } from "@/contexts/GamificationContext";
import ProgressChart from "@/components/features/health/ProgressChart";
import MomentumInsightsCard from "@/components/features/dashboard/MomentumInsightsCard";
import { InlineError } from "@/components/ui/ErrorFallback";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Achievement } from "@/types/health";
import { selectionFeedback } from "@/utils/haptics";

type ViewType = "overview" | "stats" | "achievements";
type TimePeriod = "7d" | "30d" | "all";

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    healthHistory,
    exerciseLogs,
    momentumInsights,
    syncError,
    clearSyncError,
    refreshAll
  } = useHealth();

  const {
    achievements,
    streaks,
    weeklyGoals,
    totalPoints,
    unlockedAchievements,
  } = useGamification();
  
  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7d");
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timePeriod) {
      case "7d":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return healthHistory;
    }

    return healthHistory.filter(h => new Date(h.date) >= cutoffDate);
  }, [healthHistory, timePeriod]);

  const stepsData = useMemo(() => {
    return filteredHistory.map(h => ({
      date: h.date,
      value: h.metrics.steps,
    }));
  }, [filteredHistory]);

  const waterData = useMemo(() => {
    return filteredHistory.map(h => ({
      date: h.date,
      value: h.metrics.water || 0,
    }));
  }, [filteredHistory]);

  const sleepData = useMemo(() => {
    return filteredHistory.map(h => ({
      date: h.date,
      value: h.metrics.sleep || 0,
    }));
  }, [filteredHistory]);

  const totalWorkouts = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timePeriod) {
      case "7d":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return exerciseLogs.length;
    }

    return exerciseLogs.filter(log => new Date(log.date) >= cutoffDate).length;
  }, [exerciseLogs, timePeriod]);

  const currentStreak = streaks.find(s => s.type === "workout");

  const hasNoData = stepsData.length === 0 && waterData.length === 0 && sleepData.length === 0;

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progrès</Text>
        <Text style={styles.headerSubtitle}>Suivez votre parcours bien-être</Text>
      </View>

      <View style={styles.viewSelector}>
        <TouchableOpacity
          style={[styles.viewButton, currentView === "overview" && styles.viewButtonActive]}
          onPress={() => {
            selectionFeedback();
            setCurrentView("overview");
          }}
          testID="view-overview"
        >
          <Trophy size={18} color={currentView === "overview" ? colors.surface : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.viewText, currentView === "overview" && styles.viewTextActive]}>
            Aperçu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewButton, currentView === "stats" && styles.viewButtonActive]}
          onPress={() => {
            selectionFeedback();
            setCurrentView("stats");
          }}
          testID="view-stats"
        >
          <TrendingUp size={18} color={currentView === "stats" ? colors.surface : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.viewText, currentView === "stats" && styles.viewTextActive]}>
            Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewButton, currentView === "achievements" && styles.viewButtonActive]}
          onPress={() => {
            selectionFeedback();
            setCurrentView("achievements");
          }}
          testID="view-achievements"
        >
          <Award size={18} color={currentView === "achievements" ? colors.surface : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.viewText, currentView === "achievements" && styles.viewTextActive]}>
            Récompenses
          </Text>
        </TouchableOpacity>
      </View>

      {syncError && (
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <InlineError
            message={syncError instanceof Error ? syncError.message : String(syncError)}
            onRetry={async () => {
              setIsRetrying(true);
              try {
                await refreshAll();
                clearSyncError();
              } finally {
                setIsRetrying(false);
              }
            }}
            isRetrying={isRetrying}
          />
        </View>
      )}

      {currentView === "overview" && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
          <MomentumInsightsCard insights={momentumInsights} />

          <View style={styles.statsRow}>
            <LinearGradient
              colors={[colors.gradient1[0], colors.gradient1[1]] as readonly [string, string, ...string[]]}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Award size={28} color={colors.surface} strokeWidth={2} />
              <Text style={styles.statValue}>{unlockedAchievements.length}</Text>
              <Text style={styles.statLabel}>Succès</Text>
            </LinearGradient>

            <LinearGradient
              colors={[colors.gradient2[0], colors.gradient2[1]] as readonly [string, string, ...string[]]}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Flame size={28} color={colors.surface} strokeWidth={2} />
              <Text style={styles.statValue}>{currentStreak?.current || 0}</Text>
              <Text style={styles.statLabel}>Jours Séquence</Text>
            </LinearGradient>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCardLight}>
              <TrendingUp size={24} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.statValue, { color: colors.text }]}>{totalPoints}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points Totaux</Text>
            </View>

            <View style={styles.statCardLight}>
              <Calendar size={24} color={colors.secondary} strokeWidth={2} />
              <Text style={[styles.statValue, { color: colors.text }]}>{totalWorkouts}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Séances</Text>
            </View>
          </View>

          {weeklyGoals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Objectifs Hebdo</Text>
              {weeklyGoals.slice(0, 3).map((goal) => (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIconContainer}>
                      <Target size={18} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                  </View>
                  <View style={styles.goalProgress}>
                    <View style={styles.goalProgressBar}>
                      <View
                        style={[
                          styles.goalProgressFill,
                          { width: `${Math.min((goal.current / goal.target) * 100, 100)}%` },
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

          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => {
              selectionFeedback();
              setCurrentView("stats");
            }}
          >
            <View style={styles.quickLinkContent}>
              <TrendingUp size={20} color={colors.primary} strokeWidth={2} />
              <Text style={styles.quickLinkText}>Voir les stats détaillées</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => {
              selectionFeedback();
              setCurrentView("achievements");
            }}
          >
            <View style={styles.quickLinkContent}>
              <Award size={20} color={colors.primary} strokeWidth={2} />
              <Text style={styles.quickLinkText}>Voir tous les succès</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {currentView === "stats" && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodButton, timePeriod === "7d" && styles.periodButtonActive]}
              onPress={() => {
                selectionFeedback();
                setTimePeriod("7d");
              }}
              testID="period-7d"
            >
              <Text style={[styles.periodText, timePeriod === "7d" && styles.periodTextActive]}>
                7 Jours
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.periodButton, timePeriod === "30d" && styles.periodButtonActive]}
              onPress={() => {
                selectionFeedback();
                setTimePeriod("30d");
              }}
              testID="period-30d"
            >
              <Text style={[styles.periodText, timePeriod === "30d" && styles.periodTextActive]}>
                30 Jours
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.periodButton, timePeriod === "all" && styles.periodButtonActive]}
              onPress={() => {
                selectionFeedback();
                setTimePeriod("all");
              }}
              testID="period-all"
            >
              <Text style={[styles.periodText, timePeriod === "all" && styles.periodTextActive]}>
                Tout
              </Text>
            </TouchableOpacity>
          </View>

          {hasNoData ? (
             <EmptyState
                icon={BarChart2}
                title="Pas encore de données"
                message="Commencez à bouger, boire de l'eau et bien dormir pour voir vos statistiques apparaître ici !"
                actionLabel="Enregistrer une activité"
                onAction={() => router.push('/workout-live' as any)}
                style={{ marginTop: 20 }}
             />
          ) : (
            <>
              <ProgressChart
                data={stepsData}
                title="Pas"
                unit=" pas"
                color={colors.primary}
              />

              <ProgressChart
                data={waterData}
                title="Hydratation"
                unit="L"
                color={colors.secondary}
              />

              <ProgressChart
                data={sleepData}
                title="Sommeil"
                unit="h"
                color={colors.primaryLight}
              />
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {currentView === "achievements" && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
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
                          { width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` },
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
                    Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  viewSelector: {
    flexDirection: "row" as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    gap: 6,
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },
  viewText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  viewTextActive: {
    color: colors.surface,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statCardLight: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.surface,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.surface,
    fontWeight: "600" as const,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 12,
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
    gap: 10,
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  goalTitle: {
    fontSize: 15,
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
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: "hidden" as const,
  },
  goalProgressFill: {
    height: "100%" as const,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  goalProgressText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    minWidth: 60,
  },
  quickLink: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickLinkContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  quickLinkText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.text,
  },
  periodSelector: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center" as const,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: colors.surface,
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
