import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react-native";
import colors from "@/constants/colors";

type ErrorType = "network" | "sync" | "auth" | "general";

interface ErrorFallbackProps {
  error?: Error | string;
  type?: ErrorType;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export function ErrorFallback({
  error,
  type = "general",
  onRetry,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
}: ErrorFallbackProps) {
  const errorMessage = error instanceof Error ? error.message : error || "An unexpected error occurred";
  
  const getErrorInfo = () => {
    switch (type) {
      case "network":
        return {
          icon: <WifiOff size={48} color={colors.error} strokeWidth={1.5} />,
          title: "Connection Error",
          description: "Unable to connect. Check your internet connection and try again.",
        };
      case "sync":
        return {
          icon: <RefreshCw size={48} color={colors.warning} strokeWidth={1.5} />,
          title: "Sync Error",
          description: "Failed to sync your data. Your changes are saved locally.",
        };
      case "auth":
        return {
          icon: <AlertCircle size={48} color={colors.error} strokeWidth={1.5} />,
          title: "Authentication Error",
          description: "There was a problem with your session. Please sign in again.",
        };
      default:
        return {
          icon: <AlertCircle size={48} color={colors.error} strokeWidth={1.5} />,
          title: "Something Went Wrong",
          description: errorMessage,
        };
    }
  };

  const errorInfo = getErrorInfo();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {errorInfo.icon}
        <Text style={styles.title}>{errorInfo.title}</Text>
        <Text style={styles.description}>{errorInfo.description}</Text>
        
        {type === "sync" && (
          <View style={styles.offlineIndicator}>
            <WifiOff size={16} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.offlineText}>Working offline - Changes will sync when online</Text>
          </View>
        )}

        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
            onPress={onRetry}
            disabled={isRetrying || retryCount >= maxRetries}
            testID="retry-button"
          >
            {isRetrying ? (
              <>
                <RefreshCw size={20} color={colors.surface} strokeWidth={2} />
                <Text style={styles.retryButtonText}>Retrying...</Text>
              </>
            ) : retryCount >= maxRetries ? (
              <Text style={styles.retryButtonText}>Maximum retries reached</Text>
            ) : (
              <>
                <RefreshCw size={20} color={colors.surface} strokeWidth={2} />
                <Text style={styles.retryButtonText}>
                  Try Again {retryCount > 0 ? `(${retryCount}/${maxRetries})` : ""}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function InlineError({
  message,
  onRetry,
  isRetrying = false,
}: {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <View style={styles.inlineContainer}>
      <View style={styles.inlineContent}>
        <AlertCircle size={16} color={colors.error} strokeWidth={2} />
        <Text style={styles.inlineMessage}>{message}</Text>
      </View>
      {onRetry && (
        <TouchableOpacity
          style={styles.inlineRetryButton}
          onPress={onRetry}
          disabled={isRetrying}
        >
          <Text style={styles.inlineRetryText}>
            {isRetrying ? "Retrying..." : "Retry"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 40,
    backgroundColor: colors.background,
  },
  content: {
    alignItems: "center" as const,
    maxWidth: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center" as const,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 22,
    marginBottom: 32,
  },
  offlineIndicator: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  offlineText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500" as const,
    flex: 1,
  },
  retryButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.surface,
  },
  inlineContainer: {
    backgroundColor: colors.error + "15",
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  inlineContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 8,
  },
  inlineMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  inlineRetryButton: {
    alignSelf: "flex-start" as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.error,
    borderRadius: 6,
  },
  inlineRetryText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.surface,
  },
});
