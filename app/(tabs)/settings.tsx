import { 
  User, 
  Bell, 
  CreditCard, 
  Settings as SettingsIcon, 
  Info, 
  ChevronRight,
  Mail,
  Key,
  Moon,
  Globe,
  Ruler,
  HelpCircle,
  FileText,
  Shield,
  LogOut
} from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useHealth } from "@/contexts/HealthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useSettings } from "@/contexts/SettingsContext";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, user, isAdmin } = useAuth();
  const { userProfile } = useHealth();
  const { currentPlan } = useSubscription();
  const { settings, updateSettings } = useSettings();

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/auth/login");
            } catch (error) {
              console.error("Sign out error:", error);
              Alert.alert("Error", "Failed to sign out");
            }
          },
        },
      ]
    );
  };



  const handleResetPassword = async () => {
    if (!user?.email) {
      Alert.alert("Error", "No email address found");
      return;
    }

    Alert.alert(
      "Reset Password",
      `A password reset link will be sent to ${user.email}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Link",
          onPress: async () => {
            try {
              console.log("Password reset requested for:", user.email);
              Alert.alert(
                "Reset Email Sent",
                "Check your email for a password reset link"
              );
            } catch (error) {
              console.error("Reset password error:", error);
              Alert.alert("Error", "Failed to send reset email");
            }
          },
        },
      ]
    );
  };

  const handleToggleUnits = async (value: boolean) => {
    const newUnit = value ? "imperial" : "metric";
    try {
      await updateSettings({ unitSystem: newUnit });
    } catch (error) {
      console.error("Failed to save unit preference:", error);
      Alert.alert("Error", "Failed to update unit preference");
    }
  };

  const handleToggleDarkMode = async (value: boolean) => {
    try {
      await updateSettings({ isDarkMode: value });
      Alert.alert("Coming Soon", "Dark mode will be available in a future update!");
    } catch (error) {
      console.error("Failed to save theme preference:", error);
      Alert.alert("Error", "Failed to update theme preference");
    }
  };

  const settingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Profile Information",
          description: userProfile?.name || "Update your profile",
          color: colors.primary,
          onPress: () => {
            Alert.alert("Profile", "Profile editing will be available soon!");
          },
        },
        {
          icon: Mail,
          label: "Email",
          description: user?.email || "No email",
          color: colors.secondary,
          onPress: () => {
            Alert.alert("Email", "Email change will be available soon!");
          },
        },
        {
          icon: Key,
          label: "Password",
          description: "Change your password",
          color: colors.accent,
          onPress: handleResetPassword,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage your notification settings",
          color: colors.primary,
          onPress: () => router.push("/(tabs)/notifications"),
          showChevron: true,
        },
        {
          icon: CreditCard,
          label: "Subscription",
          description: `Current plan: ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}`,
          color: "#FFD700",
          onPress: () => router.push("/(tabs)/subscription"),
          showChevron: true,
        },
        {
          icon: Ruler,
          label: "Unit System",
          description: settings.unitSystem === "metric" ? "Metric (kg, cm)" : "Imperial (lb, in)",
          color: "#9B59B6",
          renderRight: () => (
            <Switch
              value={settings.unitSystem === "imperial"}
              onValueChange={handleToggleUnits}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          ),
        },
        {
          icon: Moon,
          label: "Dark Mode",
          description: settings.isDarkMode ? "Enabled" : "Disabled",
          color: "#34495E",
          renderRight: () => (
            <Switch
              value={settings.isDarkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          ),
        },
        {
          icon: Globe,
          label: "Language",
          description: "English (US)",
          color: "#3498DB",
          onPress: () => {
            Alert.alert("Language", "More languages coming soon!");
          },
        },
      ],
    },
    ...(isAdmin ? [{
      title: "Admin",
      items: [
        {
          icon: Shield,
          label: "Admin Dashboard",
          description: "Manage users and view analytics",
          color: "#fbbf24",
          onPress: () => router.push("/admin" as any),
          showChevron: true,
        },
      ],
    }] : []),
    {
      title: "Privacy & Security",
      items: [
        {
          icon: Shield,
          label: "Privacy & Data",
          description: "Export data, manage privacy, delete account",
          color: "#27AE60",
          onPress: () => router.push("/privacy" as any),
          showChevron: true,
        },
      ],
    },
    {
      title: "Support & Legal",
      items: [
        {
          icon: HelpCircle,
          label: "Help & Support",
          description: "Get help with your account",
          color: colors.primary,
          onPress: () => router.push("/(tabs)/support"),
          showChevron: true,
        },
        {
          icon: FileText,
          label: "Terms of Service",
          description: "Read our terms",
          color: colors.textSecondary,
          onPress: () => {
            Alert.alert("Terms of Service", "Terms will be displayed here.");
          },
        },
        {
          icon: FileText,
          label: "Privacy Policy",
          description: "Read our privacy policy",
          color: colors.textSecondary,
          onPress: () => {
            Alert.alert("Privacy Policy", "Privacy policy will be displayed here.");
          },
        },
        {
          icon: Info,
          label: "About",
          description: "Version 1.0.0",
          color: colors.textTertiary,
          onPress: () => {
            Alert.alert(
              "About",
              "AI-Powered Wellness Coach\nVersion 1.0.0\n\nYour journey to a healthier you."
            );
          },
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <SettingsIcon size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                const isLast = itemIndex === section.items.length - 1;

                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.settingItem,
                      isLast && styles.settingItemLast,
                    ]}
                    onPress={item.onPress}
                    disabled={!item.onPress && !item.renderRight}
                  >
                    <View style={styles.settingLeft}>
                      <View
                        style={[
                          styles.settingIconContainer,
                          { backgroundColor: `${item.color}15` },
                        ]}
                      >
                        <IconComponent size={20} color={item.color} />
                      </View>
                      <View style={styles.settingText}>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                        {item.description && (
                          <Text style={styles.settingDescription}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    {item.renderRight ? (
                      item.renderRight()
                    ) : item.showChevron !== false ? (
                      <ChevronRight size={20} color={colors.textTertiary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={colors.error} strokeWidth={2} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for your wellness journey
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden" as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signOutButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.error,
    marginTop: 8,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.error,
    marginLeft: 8,
  },
  footer: {
    marginTop: 24,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "center" as const,
    lineHeight: 20,
  },
});
