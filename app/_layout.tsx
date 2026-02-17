import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { StripeProvider } from '@stripe/stripe-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { subscribeToAuthChanges } from '@/services/firebase';
import { store } from '@/store';
import { setUser } from '@/store/authSlice';

// No tabs, using only stack navigation

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = subscribeToAuthChanges((user) => {
      store.dispatch(setUser(user));
    });

    return () => unsubscribe();
  }, []);

  return (
    <Provider store={store}>
      <StripeProvider
        publishableKey="pk_test_YOUR_STRIPE_PUBLISHABLE_KEY"
        merchantIdentifier="merchant.com.your_app_name"
        urlScheme="your-app-scheme"
      >
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="movie" options={{ headerShown: true }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </StripeProvider>
    </Provider>
  );
}
