import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart3 } from "lucide-react-native";
import colors from "@/constants/colors";
import DashboardOverview from "@/components/features/dashboard/DashboardOverview";
import { InlineError } from "@/components/ui/ErrorFallback";
import { useHealth } from "@/contexts/HealthContext";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { syncError, clearSyncError, refreshAll, hasStorageError, initializationErrors } = useHealth();
  const [isRetrying, setIsRetrying] = React.useState<boolean>(false);

  // Combine errors
  const errorToDisplay = syncError || (hasStorageError ? new Error("Failed to load health data. Please check your connection.") : null) || (initializationErrors.firebase ? initializationErrors.firebase : null);

  const errorMessage = errorToDisplay ? (errorToDisplay instanceof Error ? errorToDisplay.message : String(errorToDisplay)) : "";
  const isSyncError = !!syncError;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <BarChart3 size={24} color={colors.primary} strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Your wellness metrics</Text>
          </View>
        </View>
      </View>

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

        <DashboardOverview />

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
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight + "20",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500" as const,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
