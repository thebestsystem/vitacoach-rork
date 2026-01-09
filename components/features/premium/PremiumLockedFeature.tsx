import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Lock, Sparkles, Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import colors from "@/constants/colors";
import appLogger from "@/utils/logger";

interface PremiumLockedFeatureProps {
  isLocked: boolean;
  children: React.ReactNode;
  featureName?: string; // e.g., "Advanced Analytics", "AI Coach"
  message?: string;
  benefits?: string[]; // List of specific benefits to upsell
  overlayColor?: string;
}

export default function PremiumLockedFeature({
  isLocked,
  children,
  featureName = "Premium Feature",
  message,
  benefits = [],
  overlayColor = "rgba(255, 255, 255, 0.85)"
}: PremiumLockedFeatureProps) {
  const router = useRouter();

  // Analytics tracking when the paywall is viewed
  useEffect(() => {
    if (isLocked) {
      appLogger.info(`Paywall view: ${featureName}`, "Analytics", { feature: featureName });
    }
  }, [isLocked, featureName]);

  const handleUpgradePress = () => {
    appLogger.info(`Paywall click: ${featureName}`, "Analytics", { feature: featureName });
    router.push("/(tabs)/subscription");
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  const displayMessage = message || `Unlock ${featureName} and more with Premium`;

  return (
    <View style={styles.container}>
      <View style={styles.content} pointerEvents="none">
        {children}
      </View>

      {Platform.OS === 'web' ? (
        <View style={[styles.overlay, { backgroundColor: overlayColor, backdropFilter: 'blur(10px)' }]}>
           {renderLockContent()}
        </View>
      ) : (
        <BlurView intensity={25} tint="light" style={styles.overlay}>
           {renderLockContent()}
        </BlurView>
      )}
    </View>
  );

  function renderLockContent() {
    return (
        <View style={styles.lockContainer}>
          <View style={styles.iconCircle}>
            <Lock size={24} color={colors.primary} />
          </View>

          <Text style={styles.title}>Unlock {featureName}</Text>
          <Text style={styles.message}>{displayMessage}</Text>

          {benefits.length > 0 && (
            <View style={styles.benefitsContainer}>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <View style={styles.checkCircle}>
                    <Check size={12} color={colors.white} strokeWidth={3} />
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleUpgradePress}
            style={styles.buttonShadow}
          >
            <LinearGradient
              colors={colors.gradient1 as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Sparkles size={16} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Get Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    // Ensure the container takes up space even if children are hidden/blurred
    minHeight: 200,
  },
  content: {
    opacity: 0.6, // Slight fade to make text less readable underneath
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  lockContainer: {
    alignItems: "center",
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
  },
  buttonShadow: {
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.5,
  },
});
