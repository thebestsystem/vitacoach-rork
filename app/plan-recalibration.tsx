import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { RefreshCw, Zap, TrendingUp, CheckCircle2 } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHealth } from "@/contexts/HealthContext";
import { PlanRecalibrationCard } from "@/components/features/dashboard/PlanRecalibrationCard";
import {
  analyzeAndSuggestRecalibration,
  applyWorkoutRecalibration,
  applyMealRecalibration,
  applyMentalWellnessRecalibration,
  type RecalibrationSuggestion,
  type RecalibrationRecommendation,
} from "@/utils/planRecalibration";

export default function PlanRecalibrationScreen() {
  const health = useHealth();
  const insets = useSafeAreaInsets();
  const [suggestions, setSuggestions] = useState<RecalibrationSuggestion | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!health.userProfile) {
        throw new Error("Profil utilisateur non disponible");
      }

      return await analyzeAndSuggestRecalibration(
        health.userProfile,
        health.workoutPlans,
        health.mealPlans,
        health.mentalWellnessPlans,
        health.healthHistory,
        health.wellnessCheckIns,
        health.exerciseLogs,
        health.mealLogs
      );
    },
    onSuccess: (data) => {
      setSuggestions(data);
    },
    onError: (error) => {
      console.error("Erreur lors de l'analyse:", error);
      Alert.alert(
        "Erreur",
        "Impossible d'analyser vos données biométriques. Veuillez réessayer."
      );
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (recommendation: RecalibrationRecommendation) => {
      if (!health.userProfile) {
        throw new Error("Profil utilisateur non disponible");
      }

      switch (recommendation.type) {
        case "workout": {
          const plan = health.workoutPlans[0];
          if (!plan) throw new Error("Aucun plan d'entraînement actif");
          const updatedPlan = await applyWorkoutRecalibration(
            plan,
            recommendation,
            health.userProfile
          );
          await health.addWorkoutPlan(updatedPlan);
          break;
        }
        case "meal": {
          const plan = health.mealPlans[0];
          if (!plan) throw new Error("Aucun plan de nutrition actif");
          const updatedPlan = await applyMealRecalibration(
            plan,
            recommendation,
            health.userProfile
          );
          await health.addMealPlan(updatedPlan);
          break;
        }
        case "mental_wellness": {
          const plan = health.mentalWellnessPlans[0];
          if (!plan) throw new Error("Aucun plan de bien-être mental actif");
          const updatedPlan = await applyMentalWellnessRecalibration(
            plan,
            recommendation,
            health.userProfile
          );
          await health.addMentalWellnessPlan(updatedPlan);
          break;
        }
      }

      return recommendation;
    },
    onSuccess: () => {
      Alert.alert(
        "✅ Recalibrage appliqué",
        "Votre plan a été ajusté en fonction de vos données biométriques.",
        [{ text: "OK" }]
      );
    },
    onError: (error) => {
      console.error("Erreur lors de l'application:", error);
      Alert.alert(
        "Erreur",
        "Impossible d'appliquer le recalibrage. Veuillez réessayer."
      );
    },
  });

  const handleApply = (recommendation: RecalibrationRecommendation) => {
    applyMutation.mutate(recommendation);
  };

  const handleDismiss = (recommendationId: string) => {
    if (!suggestions) return;
    
    setSuggestions({
      ...suggestions,
      recommendations: suggestions.recommendations.filter(
        (r) => r.id !== recommendationId
      ),
    });
  };

  const handleAnalyze = () => {
    analyzeMutation.mutate();
  };

  const getUrgencyColor = () => {
    if (!suggestions) return "#6B7280";
    switch (suggestions.urgency) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getUrgencyLabel = () => {
    if (!suggestions) return "";
    switch (suggestions.urgency) {
      case "high":
        return "Urgence élevée";
      case "medium":
        return "Urgence modérée";
      case "low":
        return "Priorité faible";
      default:
        return "";
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Recalibrage intelligent",
          headerStyle: { backgroundColor: "#FFF" },
          headerShadowVisible: false,
        }}
      />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: insets.bottom || 20 }}
        showsVerticalScrollIndicator={false}
      >
          <View style={styles.content}>
            <View style={styles.heroSection}>
              <View style={styles.heroIcon}>
                <Zap size={32} color="#3B82F6" />
              </View>
              <Text style={styles.heroTitle}>Adaptation intelligente</Text>
              <Text style={styles.heroSubtitle}>
                Vos plans s&apos;adaptent automatiquement à votre sommeil, stress et niveau
                d&apos;énergie pour optimiser vos résultats
              </Text>
            </View>

            {!suggestions && !analyzeMutation.isPending && (
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={handleAnalyze}
                disabled={analyzeMutation.isPending}
              >
                <RefreshCw size={20} color="#FFF" />
                <Text style={styles.analyzeButtonText}>Analyser mes données</Text>
              </TouchableOpacity>
            )}

            {analyzeMutation.isPending && (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>
                  Analyse de vos données biométriques...
                </Text>
                <Text style={styles.loadingSubtext}>
                  Cela peut prendre quelques secondes
                </Text>
              </View>
            )}

            {suggestions && suggestions.recommendations.length > 0 && (
              <>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <View
                      style={[
                        styles.urgencyBadge,
                        { backgroundColor: getUrgencyColor() + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.urgencyText, { color: getUrgencyColor() }]}
                      >
                        {getUrgencyLabel()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={handleAnalyze}
                    >
                      <RefreshCw size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.summaryText}>{suggestions.summary}</Text>
                  {suggestions.autoApplyRecommended && (
                    <View style={styles.autoApplyNotice}>
                      <TrendingUp size={16} color="#10B981" />
                      <Text style={styles.autoApplyText}>
                        Ajustements mineurs peuvent être appliqués automatiquement
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.recommendationsTitle}>
                  Recommandations ({suggestions.recommendations.length})
                </Text>

                {suggestions.recommendations.map((recommendation) => (
                  <PlanRecalibrationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onApply={() => handleApply(recommendation)}
                    onDismiss={() => handleDismiss(recommendation.id)}
                    isApplying={applyMutation.isPending}
                  />
                ))}
              </>
            )}

            {suggestions && suggestions.recommendations.length === 0 && (
              <View style={styles.emptyState}>
                <CheckCircle2 size={48} color="#10B981" />
                <Text style={styles.emptyTitle}>Tout est parfait ! 🎉</Text>
                <Text style={styles.emptySubtitle}>
                  Vos plans sont bien alignés avec vos données biométriques actuelles.
                  Continuez comme ça !
                </Text>
                <TouchableOpacity
                  style={styles.reanalyzeButton}
                  onPress={handleAnalyze}
                >
                  <RefreshCw size={18} color="#3B82F6" />
                  <Text style={styles.reanalyzeButtonText}>Réanalyser</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Comment ça marche ?</Text>
              <View style={styles.infoItem}>
                <Text style={styles.infoNumber}>1</Text>
                <Text style={styles.infoText}>
                  L&apos;IA analyse vos données de sommeil, stress, énergie et performance
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoNumber}>2</Text>
                <Text style={styles.infoText}>
                  Des ajustements sont suggérés si vos plans ne correspondent plus à
                  votre état
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoNumber}>3</Text>
                <Text style={styles.infoText}>
                  Vous choisissez d&apos;appliquer ou d&apos;ignorer chaque recommandation
                </Text>
              </View>
            </View>
          </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  analyzeButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  loadingSection: {
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 13,
    fontWeight: "600",
  },
  refreshButton: {
    padding: 8,
  },
  summaryText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  autoApplyNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
  },
  autoApplyText: {
    fontSize: 13,
    color: "#065F46",
    flex: 1,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    paddingHorizontal: 32,
  },
  reanalyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  reanalyzeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B82F6",
  },
  infoSection: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    color: "#3B82F6",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
});
