import { Dumbbell, Apple, Brain, Clock, Calendar, Repeat, Video } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import colors from "@/constants/colors";
import { useHealth } from "@/contexts/HealthContext";

type TabType = "workouts" | "meals" | "wellness";

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { workoutPlans, mealPlans, mentalWellnessPlans } = useHealth();
  const [activeTab, setActiveTab] = useState<TabType>("workouts");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Plans</Text>
          <Text style={styles.headerSubtitle}>AI-generated fitness & nutrition</Text>
        </View>
        <TouchableOpacity
          style={styles.coachButton}
          onPress={() => router.push("/coach-session" as any)}
        >
          <Video size={20} color="#FFF" />
          <Text style={styles.coachButtonText}>Live Coach</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "workouts" && styles.tabActive]}
          onPress={() => setActiveTab("workouts")}
          testID="workouts-tab"
        >
          <Dumbbell
            size={20}
            color={activeTab === "workouts" ? colors.primary : colors.textSecondary}
            strokeWidth={2}
          />
          <Text style={[styles.tabText, activeTab === "workouts" && styles.tabTextActive]}>
            Workouts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "meals" && styles.tabActive]}
          onPress={() => setActiveTab("meals")}
          testID="meals-tab"
        >
          <Apple
            size={20}
            color={activeTab === "meals" ? colors.primary : colors.textSecondary}
            strokeWidth={2}
          />
          <Text style={[styles.tabText, activeTab === "meals" && styles.tabTextActive]}>
            Nutrition
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "wellness" && styles.tabActive]}
          onPress={() => setActiveTab("wellness")}
          testID="wellness-tab"
        >
          <Brain
            size={20}
            color={activeTab === "wellness" ? colors.primary : colors.textSecondary}
            strokeWidth={2}
          />
          <Text style={[styles.tabText, activeTab === "wellness" && styles.tabTextActive]}>
            Wellness
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {activeTab === "workouts" && (
          <>
            {workoutPlans.length === 0 ? (
              <View style={styles.emptyState}>
                <Dumbbell size={48} color={colors.textTertiary} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Workout Plans Yet</Text>
                <Text style={styles.emptyText}>
                  Chat with your AI coach to create personalized workout plans
                </Text>
              </View>
            ) : (
              workoutPlans.map((plan) => (
                <TouchableOpacity key={plan.id} style={styles.planCard} testID={`workout-${plan.id}`}>
                  <View style={styles.planHeader}>
                    <View style={styles.planIconContainer}>
                      <Dumbbell size={24} color={colors.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      <Text style={styles.planDescription} numberOfLines={2}>
                        {plan.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={14} color={colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.metaText}>{plan.duration} min</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color={colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.metaText}>{plan.exercises.length} exercises</Text>
                    </View>
                    <View style={[styles.badge, styles[`badge${plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1)}` as keyof typeof styles]]}>
                      <Text style={styles.badgeText}>{plan.difficulty}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {mealPlans.length > 0 && (
                <TouchableOpacity
                    style={styles.shoppingListButton}
                    onPress={() => router.push("/shopping-list" as any)}
                >
                    <Text style={styles.shoppingListButtonText}>View Shopping List</Text>
                </TouchableOpacity>
            )}
          </>
        )}

        {activeTab === "meals" && (
          <>
            {mealPlans.length === 0 ? (
              <View style={styles.emptyState}>
                <Apple size={48} color={colors.textTertiary} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Meal Plans Yet</Text>
                <Text style={styles.emptyText}>
                  Chat with your AI coach to create personalized nutrition plans
                </Text>
              </View>
            ) : (
              mealPlans.map((plan) => (
                <TouchableOpacity key={plan.id} style={styles.planCard} testID={`meal-${plan.id}`}>
                  <View style={styles.planHeader}>
                    <View style={styles.planIconContainer}>
                      <Apple size={24} color={colors.secondary} strokeWidth={2} />
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      <Text style={styles.planDescription} numberOfLines={2}>
                        {plan.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaText}>{plan.totalCalories} cal</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaText}>{plan.meals.length} meals</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {activeTab === "wellness" && (
          <>
            {mentalWellnessPlans.length === 0 ? (
              <View style={styles.emptyState}>
                <Brain size={48} color={colors.textTertiary} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Wellness Programs Yet</Text>
                <Text style={styles.emptyText}>
                  Chat with your AI coach to create mental wellness programs
                </Text>
              </View>
            ) : (
              mentalWellnessPlans.map((plan) => (
                <TouchableOpacity key={plan.id} style={styles.planCard} testID={`wellness-${plan.id}`}>
                  <View style={styles.planHeader}>
                    <View style={styles.planIconContainer}>
                      <Brain size={24} color={colors.accent} strokeWidth={2} />
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      <Text style={styles.planDescription} numberOfLines={2}>
                        {plan.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={14} color={colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.metaText}>{plan.duration} min</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Repeat size={14} color={colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.metaText}>{plan.activities.length} activities</Text>
                    </View>
                    <View style={[styles.badge, styles.badgeWellness]}>
                      <Text style={styles.badgeText}>{plan.category.replace(/_/g, " ")}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coachButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  coachButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
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
  tabs: {
    flexDirection: "row" as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 22,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeader: {
    flexDirection: "row" as const,
    marginBottom: 12,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  planMeta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    flexWrap: "wrap" as const,
  },
  metaItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500" as const,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: "auto" as const,
  },
  badgeEasy: {
    backgroundColor: colors.success,
  },
  badgeMedium: {
    backgroundColor: colors.warning,
  },
  badgeHard: {
    backgroundColor: colors.error,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.surface,
    textTransform: "capitalize" as const,
  },
  badgeWellness: {
    backgroundColor: colors.accent,
  },
  shoppingListButton: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shoppingListButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
