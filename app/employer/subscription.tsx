import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSelector } from '@/hooks/useRedux';
import { userService, UserProfile } from '@/services/userService';
import { SUBSCRIPTION_PLANS, subscriptionService, SubscriptionPlan } from '@/services/subscriptionService';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStripe } from '@stripe/stripe-react-native';

export default function SubscriptionScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserProfile(user!.uid);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (profile?.subscriptionPlan === plan.id) return;

    Alert.alert(
      'Change Plan',
      `Are you sure you want to switch to the ${plan.name} plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setUpdatingPlan(plan.id);
              const result = await subscriptionService.updateUserPlan(user!.uid, plan.id);

              if (result?.url) {
                // For Stripe Checkout (redirect to browser)
                Linking.openURL(result.url);
              } else {
                // Potentially handle PaymentSheet directly if we ever switch to it
                Alert.alert('Error', 'Failed to get Stripe checkout URL.');
              }
            } catch (error) {
              console.error('Error during plan selection:', error);
              Alert.alert('Error', 'Failed to initiate subscription change.');
            } finally {
              setUpdatingPlan(null);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  const currentPlanId = profile?.subscriptionPlan || 'free';

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ 
        title: '',
        headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.headerCircleButton, { backgroundColor: theme.surface, ...Shadows.sm, marginLeft: Spacing.md }]}
          >
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
        ),
      }} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSpacer} />

        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Subscription Plans</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Scale your hiring with the right tools and reach.
          </ThemedText>
        </View>

        {SUBSCRIPTION_PLANS.map((plan) => {
          const isActive = currentPlanId === plan.id;
          const isPro = plan.id === 'pro';
          const isEnterprise = plan.id === 'enterprise';
          
          return (
            <View 
              key={plan.id} 
              style={[
                styles.planCard, 
                { backgroundColor: theme.surface, borderColor: theme.border, ...Shadows.md },
                isActive && { borderColor: theme.primary, borderWidth: 2 },
                isEnterprise && styles.enterpriseCard
              ]}
            >
              {isActive && (
                <View style={[styles.badge, { backgroundColor: '#34C759' }]}>
                  <ThemedText style={styles.badgeText}>CURRENT PLAN</ThemedText>
                </View>
              )}
              
              {isPro && !isActive && (
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                  <ThemedText style={styles.badgeText}>MOST POPULAR</ThemedText>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <View style={[styles.iconBox, { backgroundColor: isEnterprise ? theme.primary + '20' : theme.background }]}>
                    <IconSymbol 
                      name={isEnterprise ? "building.2.fill" : isPro ? "star.fill" : "person.fill"} 
                      size={20} 
                      color={isEnterprise ? theme.primary : theme.textSecondary} 
                    />
                  </View>
                  <View>
                    <ThemedText type="subtitle" style={[styles.planName, { color: theme.text }]}>{plan.name}</ThemedText>
                    {isEnterprise && (
                      <ThemedText style={[styles.enterpriseTag, { color: theme.primary }]}>Premium Support Included</ThemedText>
                    )}
                  </View>
                </View>
                <View style={styles.priceContainer}>
                  <ThemedText style={[styles.currency, { color: theme.text }]}>$</ThemedText>
                  <ThemedText style={[styles.price, { color: theme.text }]}>{plan.price}</ThemedText>
                  <ThemedText style={[styles.interval, { color: theme.textSecondary }]}>/mo</ThemedText>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={[styles.checkCircle, { backgroundColor: theme.primary + '15' }]}>
                      <IconSymbol name="checkmark" size={12} color={theme.primary} />
                    </View>
                    <ThemedText style={[styles.featureText, { color: theme.textSecondary }]}>{feature}</ThemedText>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={[
                  styles.selectButton,
                  { backgroundColor: theme.primary },
                  isActive && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.primary },
                  updatingPlan === plan.id && { opacity: 0.7 }
                ]}
                onPress={() => handleSelectPlan(plan)}
                disabled={isActive || updatingPlan !== null}
              >
                {updatingPlan === plan.id ? (
                  <ActivityIndicator color={isActive ? theme.primary : "#fff"} />
                ) : (
                  <ThemedText style={[
                    styles.selectButtonText,
                    isActive && { color: theme.primary }
                  ]}>
                    {isActive ? 'Currently Active' : `Upgrade to ${plan.name}`}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: theme.textTertiary }]}>
            Prices are in USD. Subscriptions can be canceled at any time. Secure payment processing via Stripe.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
  },
  headerSpacer: {
    height: Platform.OS === 'ios' ? 100 : 80,
  },
  headerCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: Spacing.xl * 1.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontSize: 16,
    lineHeight: 22,
  },
  planCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    position: 'relative',
    borderWidth: 1.5,
  },
  enterpriseCard: {
    backgroundColor: '#F8F9FF',
    borderColor: '#E0E7FF',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    zIndex: 1,
    ...Shadows.sm,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
  },
  enterpriseTag: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 1,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
  },
  interval: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: Spacing.lg,
  },
  featuresList: {
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  selectButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    ...Shadows.sm,
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
