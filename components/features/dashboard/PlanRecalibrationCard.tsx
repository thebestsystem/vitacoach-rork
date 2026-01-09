import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertTriangle, TrendingDown, CheckCircle, Clock } from "lucide-react-native";
import type { RecalibrationRecommendation } from "@/utils/planRecalibration";

interface PlanRecalibrationCardProps {
  recommendation: RecalibrationRecommendation;
  onApply: () => void;
  onDismiss: () => void;
  isApplying?: boolean;
}

export function PlanRecalibrationCard({
  recommendation,
  onApply,
  onDismiss,
  isApplying = false,
}: PlanRecalibrationCardProps) {
  const getSeverityColor = () => {
    switch (recommendation.severity) {
      case "major":
        return "#EF4444";
      case "moderate":
        return "#F59E0B";
      case "minor":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const getSeverityLabel = () => {
    switch (recommendation.severity) {
      case "major":
        return "Ajustement majeur";
      case "moderate":
        return "Ajustement modéré";
      case "minor":
        return "Ajustement mineur";
      default:
        return "";
    }
  };

  const getTypeLabel = () => {
    switch (recommendation.type) {
      case "workout":
        return "🏋️ Entraînement";
      case "meal":
        return "🍽️ Nutrition";
      case "mental_wellness":
        return "🧘 Bien-être mental";
      default:
        return "";
    }
  };

  const severityColor = getSeverityColor();

  return (
    <View style={[styles.card, { borderLeftColor: severityColor }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AlertTriangle size={20} color={severityColor} />
          <Text style={styles.typeText}>{getTypeLabel()}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: severityColor + "20" }]}>
          <Text style={[styles.badgeText, { color: severityColor }]}>
            {getSeverityLabel()}
          </Text>
        </View>
      </View>

      <Text style={styles.reason}>{recommendation.reason}</Text>

      {recommendation.biometricTriggers.length > 0 && (
        <View style={styles.triggersSection}>
          <Text style={styles.sectionTitle}>📊 Signaux biométriques:</Text>
          {recommendation.biometricTriggers.map((trigger, index) => (
            <View key={index} style={styles.triggerItem}>
              <TrendingDown size={14} color="#EF4444" />
              <Text style={styles.triggerText}>{trigger}</Text>
            </View>
          ))}
        </View>
      )}

      {recommendation.changes.length > 0 && (
        <View style={styles.changesSection}>
          <Text style={styles.sectionTitle}>🔄 Modifications proposées:</Text>
          {recommendation.changes.map((change, index) => (
            <View key={index} style={styles.changeItem}>
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>Avant:</Text>
                <Text style={styles.beforeText}>{change.before}</Text>
              </View>
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>Après:</Text>
                <Text style={styles.afterText}>{change.after}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {recommendation.expectedBenefits.length > 0 && (
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>✨ Bénéfices attendus:</Text>
          {recommendation.expectedBenefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          disabled={isApplying}
        >
          <Text style={styles.dismissButtonText}>Ignorer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.applyButton, isApplying && styles.applyButtonDisabled]}
          onPress={onApply}
          disabled={isApplying}
        >
          {isApplying ? (
            <>
              <Clock size={18} color="#FFF" />
              <Text style={styles.applyButtonText}>Application...</Text>
            </>
          ) : (
            <>
              <CheckCircle size={18} color="#FFF" />
              <Text style={styles.applyButtonText}>Appliquer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reason: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  triggersSection: {
    marginBottom: 16,
  },
  triggerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  triggerText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  changesSection: {
    marginBottom: 16,
  },
  changeItem: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    width: 60,
  },
  beforeText: {
    fontSize: 13,
    color: "#EF4444",
    flex: 1,
  },
  afterText: {
    fontSize: 13,
    color: "#10B981",
    flex: 1,
    fontWeight: "500",
  },
  benefitsSection: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  applyButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
});
