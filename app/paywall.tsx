import { PaywallView } from '@/components/features/subscription/PaywallView';
import { Stack } from 'expo-router';
import React from 'react';

export default function PaywallScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          title: 'Upgrade to Pro',
          headerShown: false, // Custom UI handles it
        }}
      />
      <PaywallView />
    </>
  );
}
