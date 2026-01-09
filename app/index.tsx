import { Redirect } from "expo-router";
import { useHealth } from "@/contexts/HealthContext";
import { useAuth } from "@/contexts/AuthContext";
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from "react-native";
import colors from "@/constants/colors";
import { useEffect, useState } from "react";

export default function Index() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { onboardingComplete, isLoading: healthLoading, isInitialized, hasStorageError, refreshAll } = useHealth();
  const [showError, setShowError] = useState<boolean>(false);
  const [retrying, setRetrying] = useState<boolean>(false);

  console.log("Index screen - Auth:", isAuthenticated, "authLoading:", authLoading, "Onboarding:", onboardingComplete, "healthLoading:", healthLoading, "Initialized:", isInitialized);

  useEffect(() => {
    if (isAuthenticated && !authLoading && !isInitialized && !healthLoading) {
      const timeout = setTimeout(() => {
        console.log("Initialization timeout after 30s - showing error");
        setShowError(true);
      }, 30000);

      return () => clearTimeout(timeout);
    } else {
      setShowError(false);
    }
  }, [authLoading, isInitialized, healthLoading, isAuthenticated]);

  const handleRetry = async () => {
    try {
      setRetrying(true);
      setShowError(false);
      await refreshAll();
    } catch (error) {
      console.error("Retry failed:", error);
      setShowError(true);
    } finally {
      setRetrying(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Authenticating...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    console.log("Redirecting to login");
    return <Redirect href="/auth/login" />;
  }

  if (healthLoading && !showError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  if (showError || hasStorageError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorText}>
          Unable to load your data. Please check your connection and try again.
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, retrying && styles.retryButtonDisabled]}
          onPress={handleRetry}
          disabled={retrying}
        >
          {retrying ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.retryButtonText}>Retry</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Setting up...</Text>
      </View>
    );
  }

  if (!onboardingComplete) {
    console.log("Redirecting to onboarding");
    return <Redirect href="/onboarding" />;
  }

  console.log("Redirecting to home");
  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 12,
    textAlign: "center" as const,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center" as const,
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  retryButtonDisabled: {
    opacity: 0.5,
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
