import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { AlertCircle, RefreshCw, Home } from "lucide-react-native";
import colors from "@/constants/colors";
import appLogger from "@/utils/logger";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    appLogger.critical(
      "React Error Boundary caught error",
      error,
      "ErrorBoundary",
      {
        componentStack: errorInfo.componentStack,
        errorCount: this.state.errorCount + 1,
      }
    );

    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    if (this.state.errorCount >= 3) {
      appLogger.critical(
        "Error boundary triggered 3+ times - potential crash loop",
        error,
        "ErrorBoundary"
      );
    }
  }

  handleRetry = (): void => {
    appLogger.info("User requested error recovery", "ErrorBoundary");
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReset = (): void => {
    appLogger.info("User requested full app reset", "ErrorBoundary");
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.handleRetry
        );
      }

      const isRecoverable = this.state.errorCount < 3;

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.iconContainer}>
              <AlertCircle size={64} color={colors.error} strokeWidth={1.5} />
            </View>

            <Text style={styles.title}>Something Went Wrong</Text>
            
            <Text style={styles.message}>
              {isRecoverable
                ? "The app encountered an unexpected error. You can try to recover or restart the app."
                : "The app is experiencing repeated errors. Please restart the app or contact support if this continues."}
            </Text>

            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Error Details (Dev Only):</Text>
                <ScrollView style={styles.debugScroll}>
                  <Text style={styles.debugText}>
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo?.componentStack && (
                    <Text style={styles.debugText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}

            <View style={styles.actionsContainer}>
              {isRecoverable && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={this.handleRetry}
                  testID="error-retry-button"
                >
                  <RefreshCw size={20} color={colors.surface} strokeWidth={2} />
                  <Text style={styles.primaryButtonText}>Try to Recover</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.secondaryButton, !isRecoverable && styles.primaryButton]}
                onPress={this.handleReset}
                testID="error-reset-button"
              >
                <Home size={20} color={isRecoverable ? colors.text : colors.surface} strokeWidth={2} />
                <Text style={[styles.secondaryButtonText, !isRecoverable && styles.primaryButtonText]}>
                  Restart App
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.errorCount}>
              Error count: {this.state.errorCount}
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    textAlign: "center" as const,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 400,
  },
  debugContainer: {
    width: "100%" as const,
    maxWidth: 500,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 12,
  },
  debugScroll: {
    maxHeight: 200,
  },
  debugText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontFamily: "monospace" as const,
    lineHeight: 18,
  },
  actionsContainer: {
    width: "100%" as const,
    maxWidth: 400,
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.surface,
  },
  secondaryButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  errorCount: {
    marginTop: 24,
    fontSize: 12,
    color: colors.textTertiary,
  },
});

export default GlobalErrorBoundary;
