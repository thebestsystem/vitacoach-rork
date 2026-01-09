import React, { useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react-native";
import colors from "@/constants/colors";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
  visible: boolean;
}

export function Toast({
  message,
  type = "info",
  duration = 3000,
  onHide,
  visible,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  }, [translateY, opacity, onHide]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, hideToast, translateY, opacity]);

  const getToastStyle = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: colors.success + "15",
          borderColor: colors.success,
        };
      case "error":
        return {
          backgroundColor: colors.error + "15",
          borderColor: colors.error,
        };
      case "warning":
        return {
          backgroundColor: colors.warning + "15",
          borderColor: colors.warning,
        };
      default:
        return {
          backgroundColor: colors.info + "15",
          borderColor: colors.info,
        };
    }
  };

  const getIcon = () => {
    const iconSize = 20;
    const strokeWidth = 2;

    switch (type) {
      case "success":
        return <CheckCircle size={iconSize} color={colors.success} strokeWidth={strokeWidth} />;
      case "error":
        return <XCircle size={iconSize} color={colors.error} strokeWidth={strokeWidth} />;
      case "warning":
        return <AlertCircle size={iconSize} color={colors.warning} strokeWidth={strokeWidth} />;
      default:
        return <Info size={iconSize} color={colors.info} strokeWidth={strokeWidth} />;
    }
  };

  if (!visible) return null;

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          ...toastStyle,
        },
      ]}
      testID="toast-container"
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute" as const,
    top: Platform.select({ ios: 50, android: 20, web: 20 }),
    left: 16,
    right: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      },
    }),
    zIndex: 9999,
  },
  content: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  iconContainer: {
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.text,
    lineHeight: 20,
  },
});

export default Toast;
