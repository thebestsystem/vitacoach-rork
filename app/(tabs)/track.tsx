import { Footprints, Droplet, Moon, Dumbbell, Heart, Plus, Minus } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useHealth } from "@/contexts/HealthContext";

type MetricType = "steps" | "water" | "sleep" | "heartRate" | "calories";

export default function TrackScreen() {
  const insets = useSafeAreaInsets();
  const { healthMetrics, updateMetrics } = useHealth();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [inputValue, setInputValue] = useState<string>("");

  const handleOpenModal = (metric: MetricType) => {
    setSelectedMetric(metric);
    const currentValue = healthMetrics?.[metric]?.toString() || "0";
    setInputValue(currentValue);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!selectedMetric) return;
    
    const value = parseFloat(inputValue) || 0;
    const currentMetrics = healthMetrics || { steps: 0, water: 0, sleep: 0, calories: 0, heartRate: 0 };
    updateMetrics({ ...currentMetrics, [selectedMetric]: value });
    setModalVisible(false);
    setInputValue("");
    setSelectedMetric(null);
  };

  const handleQuickAdjust = (metric: MetricType, amount: number) => {
    const current = healthMetrics?.[metric] || 0;
    const newValue = Math.max(0, (current as number) + amount);
    const currentMetrics = healthMetrics || { steps: 0, water: 0, sleep: 0, calories: 0, heartRate: 0 };
    updateMetrics({ ...currentMetrics, [metric]: newValue });
  };

  const getMetricIcon = (metric: MetricType) => {
    switch (metric) {
      case "steps":
        return <Footprints size={24} color={colors.primary} strokeWidth={2} />;
      case "water":
        return <Droplet size={24} color={colors.secondary} strokeWidth={2} />;
      case "sleep":
        return <Moon size={24} color={colors.primaryLight} strokeWidth={2} />;
      case "heartRate":
        return <Heart size={24} color={colors.accent} strokeWidth={2} />;
      case "calories":
        return <Dumbbell size={24} color={colors.warning} strokeWidth={2} />;
    }
  };

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case "steps":
        return "Steps";
      case "water":
        return "Water (L)";
      case "sleep":
        return "Sleep (h)";
      case "heartRate":
        return "Heart Rate";
      case "calories":
        return "Calories";
    }
  };

  const getMetricValue = (metric: MetricType) => {
    return healthMetrics?.[metric] || 0;
  };

  const getMetricGoal = (metric: MetricType) => {
    switch (metric) {
      case "steps":
        return 10000;
      case "water":
        return 2.5;
      case "sleep":
        return 8;
      case "heartRate":
        return 72;
      case "calories":
        return 2000;
    }
  };

  const getProgressPercentage = (metric: MetricType) => {
    const value = getMetricValue(metric) as number;
    const goal = getMetricGoal(metric);
    return Math.min((value / goal) * 100, 100);
  };

  const metrics: MetricType[] = ["steps", "water", "sleep", "heartRate", "calories"];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Metrics</Text>
        <Text style={styles.headerSubtitle}>Monitor your daily health data</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {metrics.map((metric) => (
          <View key={metric} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={styles.metricIconContainer}>{getMetricIcon(metric)}</View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>{getMetricLabel(metric)}</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricValue}>{getMetricValue(metric)}</Text>
                  <Text style={styles.metricGoal}>/ {getMetricGoal(metric)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getProgressPercentage(metric)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(getProgressPercentage(metric))}%</Text>
            </View>

            <View style={styles.metricActions}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => {
                  if (metric === "steps") handleQuickAdjust(metric, -1000);
                  else if (metric === "water") handleQuickAdjust(metric, -0.25);
                  else if (metric === "sleep") handleQuickAdjust(metric, -0.5);
                  else if (metric === "heartRate") handleQuickAdjust(metric, -5);
                  else handleQuickAdjust(metric, -100);
                }}
                testID={`decrease-${metric}`}
              >
                <Minus size={18} color={colors.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleOpenModal(metric)}
                testID={`edit-${metric}`}
              >
                <Text style={styles.editButtonText}>Edit Value</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => {
                  if (metric === "steps") handleQuickAdjust(metric, 1000);
                  else if (metric === "water") handleQuickAdjust(metric, 0.25);
                  else if (metric === "sleep") handleQuickAdjust(metric, 0.5);
                  else if (metric === "heartRate") handleQuickAdjust(metric, 5);
                  else handleQuickAdjust(metric, 100);
                }}
                testID={`increase-${metric}`}
              >
                <Plus size={18} color={colors.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <Text style={styles.modalTitle}>
              Edit {selectedMetric ? getMetricLabel(selectedMetric) : ""}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="decimal-pad"
              placeholder="Enter value"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              testID="metric-input"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}
                testID="cancel-button"
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSave}
                testID="save-button"
              >
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500" as const,
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: "row" as const,
    alignItems: "baseline" as const,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
  },
  metricGoal: {
    fontSize: 18,
    fontWeight: "500" as const,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  progressBarContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 16,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%" as const,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    minWidth: 45,
    textAlign: "right" as const,
  },
  metricActions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  quickButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  editButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%" as const,
    maxWidth: 400,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 20,
    textAlign: "center" as const,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
    textAlign: "center" as const,
  },
  modalButtons: {
    flexDirection: "row" as const,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.surface,
  },
});
