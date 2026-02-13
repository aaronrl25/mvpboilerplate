import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSelector } from '@/hooks/useRedux';
import { userService, UserProfile } from '@/services/userService';
import { SUBSCRIPTION_PLANS, subscriptionService, SubscriptionPlan } from '@/services/subscriptionService';

export default function SubscriptionScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  
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
              await subscriptionService.updateUserPlan(user!.uid, plan.id);
              await fetchProfile();
              Alert.alert('Success', `You are now on the ${plan.name} plan!`);
            } catch (error) {
              Alert.alert('Error', 'Failed to update subscription plan');
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
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  const currentPlanId = profile?.subscriptionPlan || 'free';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Subscription Plans', headerBackTitle: 'Back' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title">Upgrade Your Hiring</ThemedText>
          <ThemedText style={styles.subtitle}>Choose the plan that fits your company's needs</ThemedText>
        </View>

        {SUBSCRIPTION_PLANS.map((plan) => (
          <View 
            key={plan.id} 
            style={[
              styles.planCard, 
              currentPlanId === plan.id && styles.activePlanCard
            ]}
          >
            {currentPlanId === plan.id && (
              <View style={styles.currentBadge}>
                <ThemedText style={styles.currentBadgeText}>CURRENT PLAN</ThemedText>
              </View>
            )}
            
            <View style={styles.planHeader}>
              <ThemedText type="subtitle" style={styles.planName}>{plan.name}</ThemedText>
              <View style={styles.priceContainer}>
                <ThemedText style={styles.currency}>$</ThemedText>
                <ThemedText style={styles.price}>{plan.price}</ThemedText>
                <ThemedText style={styles.interval}>/{plan.interval}</ThemedText>
              </View>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <IconSymbol name="checkmark.circle.fill" size={18} color="#34C759" />
                  <ThemedText style={styles.featureText}>{feature}</ThemedText>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[
                styles.selectButton,
                currentPlanId === plan.id && styles.selectedButton,
                updatingPlan === plan.id && styles.disabledButton
              ]}
              onPress={() => handleSelectPlan(plan)}
              disabled={currentPlanId === plan.id || updatingPlan !== null}
            >
              {updatingPlan === plan.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={[
                  styles.selectButtonText,
                  currentPlanId === plan.id && styles.selectedButtonText
                ]}>
                  {currentPlanId === plan.id ? 'Active Plan' : `Upgrade to ${plan.name}`}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Prices are in USD. Subscriptions can be canceled at any time.
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    fontSize: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  activePlanCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F0F7FF',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  interval: {
    fontSize: 14,
    color: '#666',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#444',
  },
  selectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  disabledButton: {
    opacity: 0.7,
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedButtonText: {
    color: '#007AFF',
  },
  footer: {
    marginTop: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
