import { LinearGradient } from "expo-linear-gradient";
import { MessageCircle, Sparkles, TrendingUp, Target, Activity, Heart, Zap, Video, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import colors from "@/constants/colors";
import { useHealth } from "@/contexts/HealthContext";
import { InlineError } from "@/components/ui/ErrorFallback";
import { selectionFeedback } from "@/utils/haptics";

const COACH_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop";

const QUICK_ACTIONS = [
  { id: 'workout', label: 'Entraînement', icon: Activity, color: colors.primary },
  { id: 'nutrition', label: 'Nutrition', icon: Heart, color: colors.accent },
  { id: 'wellness', label: 'Bien-être', icon: Sparkles, color: colors.secondary },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    userProfile,
    healthMetrics,
    syncError,
    clearSyncError,
    refreshAll,
    hasStorageError,
    coachPlaybook,
  } = useHealth();
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const errorToDisplay = syncError || (hasStorageError ? new Error("Échec du chargement des données.") : null);
  const errorMessage = errorToDisplay ? (errorToDisplay instanceof Error ? errorToDisplay.message : String(errorToDisplay)) : "";
  const isSyncError = !!syncError;

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  }, []);

  const todayGoals = React.useMemo(() => {
    const goals = [];
    if (healthMetrics?.steps) {
      goals.push({ label: 'Pas', value: healthMetrics.steps, target: 10000, unit: '', icon: TrendingUp });
    }
    if (healthMetrics?.calories) {
      goals.push({ label: 'Calories', value: healthMetrics.calories, target: 2000, unit: 'kcal', icon: Zap });
    }
    return goals;
  }, [healthMetrics]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {errorToDisplay && (
          <InlineError
            message={errorMessage}
            onRetry={async () => {
              setIsRetrying(true);
              try {
                await refreshAll();
                if (isSyncError) clearSyncError();
              } finally {
                setIsRetrying(false);
              }
            }}
            isRetrying={isRetrying}
          />
        )}

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{userProfile?.name || "Champion"}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.coachCard}
          onPress={() => {
            selectionFeedback();
            router.push("/coach-session" as any);
          }}
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={[colors.gradient1[0], colors.gradient1[1]] as readonly [string, string, ...string[]]} 
            style={styles.coachGradient} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.coachHeader}>
              <Image source={{ uri: COACH_AVATAR }} style={styles.coachAvatar} />
              <View style={styles.coachInfo}>
                <Text style={styles.coachLabel}>Votre Coach Exécutif</Text>
                <Text style={styles.coachName}>Vita</Text>
              </View>
              <View style={styles.coachBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>En ligne</Text>
              </View>
            </View>
            
            <Text style={styles.coachMessage}>
              {coachPlaybook?.headline || "Comment puis-je vous aider aujourd'hui ?"}
            </Text>
            
            <View style={styles.coachActions}>
              <View style={styles.coachActionButton}>
                <MessageCircle size={18} color={colors.surface} strokeWidth={2} />
                <Text style={styles.coachActionText}>Discuter</Text>
              </View>
              <View style={styles.coachActionButton}>
                <Video size={18} color={colors.surface} strokeWidth={2} />
                <Text style={styles.coachActionText}>Appel vidéo</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionCard}
                  onPress={() => {
                    selectionFeedback();
                    if (action.id === 'workout') router.push('/workout-live' as any);
                  }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                    <IconComponent size={24} color={action.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                  <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {todayGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectifs du jour</Text>
            <View style={styles.goalsGrid}>
              {todayGoals.map((goal, index) => {
                const IconComponent = goal.icon;
                const progress = (goal.value / goal.target) * 100;
                return (
                  <View key={index} style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                      <IconComponent size={20} color={colors.primary} strokeWidth={2} />
                      <Text style={styles.goalLabel}>{goal.label}</Text>
                    </View>
                    <Text style={styles.goalValue}>
                      {goal.value.toLocaleString()}
                      <Text style={styles.goalUnit}> {goal.unit}</Text>
                    </Text>
                    <View style={styles.goalProgress}>
                      <View style={[styles.goalProgressFill, { width: `${Math.min(progress, 100)}%` }]} />
                    </View>
                    <Text style={styles.goalTarget}>{Math.round(progress)}% de {goal.target.toLocaleString()}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {coachPlaybook && coachPlaybook.focusAreas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Focus du jour</Text>
            <View style={styles.recommendationsCard}>
              {coachPlaybook.focusAreas.slice(0, 2).map((focus, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={styles.recommendationIconWrapper}>
                    <Target size={20} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.recommendationContent}>
                    <Text style={styles.recommendationText}>{focus}</Text>
                  </View>
                </View>
              ))}
              {coachPlaybook.celebration && (
                <View style={styles.celebrationBanner}>
                  <Sparkles size={18} color={colors.accent} strokeWidth={2} />
                  <Text style={styles.celebrationText}>{coachPlaybook.celebration}</Text>
                </View>
              )}
            </View>
          </View>
        )}

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
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  name: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    marginTop: 4,
  },
  coachCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: "hidden" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  coachGradient: {
    padding: 24,
  },
  coachHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  coachAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  coachInfo: {
    flex: 1,
  },
  coachLabel: {
    fontSize: 13,
    color: colors.surface,
    opacity: 0.8,
    fontWeight: "500" as const,
  },
  coachName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.surface,
    marginTop: 2,
  },
  coachBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "rgba(255, 255, 255, 0.2)" as const,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80" as const,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.surface,
  },
  coachMessage: {
    fontSize: 16,
    color: colors.surface,
    lineHeight: 24,
    marginBottom: 20,
    opacity: 0.95,
  },
  coachActions: {
    flexDirection: "row" as const,
    gap: 12,
  },
  coachActionButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255, 255, 255, 0.2)" as const,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  coachActionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.surface,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  quickActionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  goalsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  goalCard: {
    flex: 1,
    minWidth: "45%" as const,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
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
  goalLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  goalValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 8,
  },
  goalUnit: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: colors.textSecondary,
  },
  goalProgress: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: "hidden" as const,
    marginBottom: 8,
  },
  goalProgressFill: {
    height: "100%" as const,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  goalTarget: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  recommendationsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: "row" as const,
    gap: 12,
  },
  recommendationIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  celebrationBanner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: `${colors.accent}10` as const,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  celebrationText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
  moodButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  moodEmoji: {
    fontSize: 32,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.surface,
    marginTop: 12,
    marginBottom: 8,
  },
  heroText: {
    fontSize: 15,
    color: colors.surface,
    opacity: 0.9,
    lineHeight: 22,
  },
  challengesPromo: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  challengesPromoContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
    gap: 12,
  },
  challengesPromoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warning + "20",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  challengesPromoText: {
    flex: 1,
  },
  challengesPromoTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 2,
  },
  challengesPromoSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  challengesPromoBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.primaryLight + "20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  challengesPromoBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
  },
  liveWorkoutButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  liveWorkoutText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: colors.surface,
  },
  metricsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: "48%" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500" as const,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%" as const,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sleepCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sleepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 16,
  },
  sleepContent: {
    flex: 1,
  },
  sleepValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 2,
  },
  sleepLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  sleepQuality: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sleepQualityText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  actionsRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: "30%" as const,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scannerCard: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.text,
    textAlign: "center" as const,
  },
});
