import { Timestamp } from 'firebase/firestore';
import { userService, SubscriptionPlanId } from './userService';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  jobLimit: number; // Maximum active jobs
  aiAccess: boolean; // Access to AI career coach for applicants
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      'Post up to 2 jobs',
      'Basic applicant tracking',
      'Standard support',
    ],
    jobLimit: 2,
    aiAccess: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    currency: 'USD',
    interval: 'month',
    features: [
      'Post up to 10 jobs',
      'Priority applicant review',
      'AI Career Coach for candidates',
      'Email support',
    ],
    jobLimit: 10,
    aiAccess: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited job postings',
      'Advanced analytics',
      'Dedicated account manager',
      'Custom branding',
      'Full AI integration',
    ],
    jobLimit: 9999,
    aiAccess: true,
  },
];

export const subscriptionService = {
  getPlanById: (planId: SubscriptionPlanId): SubscriptionPlan => {
    return SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];
  },

  updateUserPlan: async (userId: string, planId: SubscriptionPlanId): Promise<void> => {
    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Invalid plan ID');

      // In a real app, this would involve a payment gateway like Stripe
      // For this MVP, we'll directly update the Firestore document
      await userService.updateProfile(userId, {
        subscriptionPlan: planId,
        subscriptionStatus: 'active',
        subscriptionEndDate: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  },

  checkJobLimit: async (userId: string, currentJobCount: number): Promise<boolean> => {
    try {
      const profile = await userService.getUserProfile(userId);
      const planId = profile?.subscriptionPlan || 'free';
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];
      
      return currentJobCount < plan.jobLimit;
    } catch (error) {
      console.error('Error checking job limit:', error);
      return false;
    }
  }
};
