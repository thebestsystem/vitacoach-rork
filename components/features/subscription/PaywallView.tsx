import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PurchasesPackage } from 'react-native-purchases';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

export const PaywallView = () => {
  const { packages, upgradePlan, restorePurchases, isLoading, isUpgrading, allPlans } = useSubscription();
  const router = useRouter();

  const handlePurchase = async (pack: PurchasesPackage) => {
    try {
      await upgradePlan(pack);
      router.back();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMockPurchase = async (plan: 'pro' | 'premium') => {
      try {
          await upgradePlan(plan);
          router.back();
      } catch (e) {
          console.error(e);
      }
  };

  // If we have RevenueCat packages, use them. Otherwise, fallback to static config (Mock Mode)
  const hasPackages = packages.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Unlock Peak Performance</Text>
        <Text style={styles.subtitle}>
          Invest in your greatest asset: your energy.
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <FeatureRow icon="infinite" text="Unlimited AI Coach Sessions" />
        <FeatureRow icon="trending-up" text="Advanced Health Trends" />
        <FeatureRow icon="calendar" text="Calendar Context Integration" />
        <FeatureRow icon="shield-checkmark" text="Priority Support" />
      </View>

      <View style={styles.plansContainer}>
        {hasPackages ? (
            packages.map((pack) => (
            <TouchableOpacity
                key={pack.identifier}
                style={styles.planCard}
                onPress={() => handlePurchase(pack)}
                disabled={isUpgrading}
            >
                <View style={styles.planInfo}>
                <Text style={styles.planName}>{pack.product.title}</Text>
                <Text style={styles.planPrice}>{pack.product.priceString} / {pack.packageType.toLowerCase()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" />
            </TouchableOpacity>
            ))
        ) : (
            <>
                <Text style={styles.mockText}>Dev Mode (No RevenueCat Packages)</Text>
                <TouchableOpacity
                    style={styles.planCard}
                    onPress={() => handleMockPurchase('pro')}
                    disabled={isUpgrading}
                >
                    <View style={styles.planInfo}>
                        <Text style={styles.planName}>Pro (Mock)</Text>
                        <Text style={styles.planPrice}>$19.99 / month</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#FFF" />
                </TouchableOpacity>
                 <TouchableOpacity
                    style={styles.planCard}
                    onPress={() => handleMockPurchase('premium')}
                    disabled={isUpgrading}
                >
                    <View style={styles.planInfo}>
                        <Text style={styles.planName}>Premium (Mock)</Text>
                        <Text style={styles.planPrice}>$39.99 / month</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#FFF" />
                </TouchableOpacity>
            </>
        )}
      </View>

      <TouchableOpacity onPress={() => restorePurchases()} style={styles.restoreButton}>
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Recurring billing. Cancel anytime.
      </Text>
    </ScrollView>
  );
};

const FeatureRow = ({ icon, text }: { icon: any; text: string }) => (
  <View style={styles.featureRow}>
    <Ionicons name={icon} size={24} color="#4F46E5" style={styles.icon} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate 900
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 40,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 16,
  },
  featureText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
  },
  plansContainer: {
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planPrice: {
    color: '#E0E7FF',
    fontSize: 14,
  },
  mockText: {
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 12,
  },
  restoreButton: {
    alignItems: 'center',
    padding: 12,
  },
  restoreText: {
    color: '#94A3B8',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
