import { AlertTriangle, ArrowUpRight, ChevronRight, ShieldCheck } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "@/constants/colors";
import type { CoachPlaybook } from "@/types/health";

interface CoachPlaybookCardProps {
  playbook: CoachPlaybook;
}

const readinessCopy: Record<CoachPlaybook["readinessTag"], { label: string; description: string; color: string }> = {
  recharge: {
    label: "Recharge Mode",
    description: "Dial down intensity and rebuild your reserves.",
    color: colors.accent,
  },
  balanced: {
    label: "Balanced Momentum",
    description: "Steady rhythm—keep stacking consistent reps.",
    color: colors.primary,
  },
  go_time: {
    label: "Go Time",
    description: "Momentum is high—swing for the meaningful win.",
    color: colors.secondary,
  },
};

function Guardrail({ title, description, severity }: { title: string; description: string; severity: "info" | "warning" | "critical" }) {
  const iconColor = severity === "critical" ? colors.error : severity === "warning" ? colors.warning : colors.info;
  return (
    <View style={styles.guardrail}>
      <AlertTriangle size={18} color={iconColor} strokeWidth={2.2} />
      <View style={styles.guardrailContent}>
        <Text style={styles.guardrailTitle}>{title}</Text>
        <Text style={styles.guardrailDescription}>{description}</Text>
      </View>
    </View>
  );
}

function MicroHabit({ title, description, anchor }: { title: string; description: string; anchor: string }) {
  return (
    <View style={styles.microHabit}>
      <View style={styles.microHabitHeader}>
        <ChevronRight size={16} color={colors.primary} strokeWidth={2.3} />
        <Text style={styles.microHabitTitle}>{title}</Text>
      </View>
      <Text style={styles.microHabitDescription}>{description}</Text>
      <Text style={styles.microHabitAnchor}>{anchor}</Text>
    </View>
  );
}

export default function CoachPlaybookCard({ playbook }: CoachPlaybookCardProps) {
  const readiness = readinessCopy[playbook.readinessTag] ?? readinessCopy.balanced;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Coach Playbook</Text>
          <Text style={styles.headline}>{playbook.headline}</Text>
        </View>
        <View style={[styles.readinessTag, { backgroundColor: readiness.color }]}> 
          <ShieldCheck size={16} color={colors.surface} strokeWidth={2.5} />
          <Text style={styles.readinessText}>{readiness.label}</Text>
        </View>
      </View>
      <Text style={styles.readinessDescription}>{readiness.description}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Focus this week</Text>
        {playbook.focusAreas.map((area) => (
          <View key={area} style={styles.focusItem}>
            <ArrowUpRight size={16} color={colors.secondaryDark} strokeWidth={2.3} />
            <Text style={styles.focusText}>{area}</Text>
          </View>
        ))}
      </View>

      {playbook.guardrails.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guardrails</Text>
          {playbook.guardrails.map((guardrail) => (
            <Guardrail key={guardrail.title} {...guardrail} />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Micro-habit plays</Text>
        {playbook.microHabits.map((habit) => (
          <MicroHabit key={habit.title} {...habit} />
        ))}
      </View>

      <View style={styles.footerRow}>
        {playbook.celebration && <Text style={styles.celebration}>{playbook.celebration}</Text>}
        <View style={styles.momentumBadge}>
          <Text style={styles.momentumLabel}>Momentum</Text>
          <Text style={styles.momentumScore}>{playbook.momentumScore > 0 ? `+${playbook.momentumScore}` : playbook.momentumScore}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
    shadowColor: "#101828",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headline: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 6,
    lineHeight: 24,
  },
  readinessTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  readinessText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  readinessDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  focusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.secondaryLight,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  focusText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.secondaryDark,
  },
  guardrail: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.warningLight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  guardrailContent: {
    flex: 1,
  },
  guardrailTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  guardrailDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  microHabit: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  microHabitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  microHabitTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  microHabitDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  microHabitAnchor: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },
  celebration: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  momentumBadge: {
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  momentumLabel: {
    fontSize: 11,
    color: colors.surface,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  momentumScore: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface,
  },
});
