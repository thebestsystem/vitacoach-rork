import { Redirect, Tabs } from "expo-router";
import { MessageCircle, TrendingUp, User, Settings } from "lucide-react-native";
import React from "react";
import colors from "@/constants/colors";
import { useHealth } from "@/contexts/HealthContext";

export default function TabLayout() {
  const { onboardingComplete, isLoading } = useHealth();

  if (!isLoading && !onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600" as const,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Coach",
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progrès",
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Réglages",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
