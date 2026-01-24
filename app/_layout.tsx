import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HealthProvider } from "@/contexts/HealthContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AccountabilityProvider } from "@/contexts/AccountabilityContext";
import { GlobalErrorBoundary } from "@/components/ui/GlobalErrorBoundary";
import { useHealthSync } from "@/hooks/useHealthSync";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  useHealthSync();

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: true, presentation: "card" }} />
      <Stack.Screen name="privacy" options={{ headerShown: true, presentation: "card" }} />
      <Stack.Screen name="challenges" options={{ headerShown: true }} />
      <Stack.Screen name="coach-session" options={{ headerShown: false }} />
      <Stack.Screen name="plan-recalibration" options={{ headerShown: true }} />
      <Stack.Screen name="shopping-list" options={{ headerShown: true }} />
      <Stack.Screen name="workout-live" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <AuthProvider>
            <NotificationProvider>
              <SubscriptionProvider>
                <GamificationProvider>
                  <HealthProvider>
                    <AccountabilityProvider>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <RootLayoutNav />
                      </GestureHandlerRootView>
                    </AccountabilityProvider>
                  </HealthProvider>
                </GamificationProvider>
              </SubscriptionProvider>
            </NotificationProvider>
          </AuthProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}
