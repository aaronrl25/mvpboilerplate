import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { clearError, login } from '@/store/authSlice';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const { loading, error, user } = useAppSelector((state) => state.auth);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    dispatch(login({ email, password }));
  };

  const navigateToSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.primary + '10' }]}>
            <IconSymbol name="briefcase.fill" size={32} color={theme.primary} />
          </View>
          <ThemedText type="title" style={styles.title}>Welcome Back</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Sign in to continue your career journey
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Email Address</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <IconSymbol name="envelope.fill" size={20} color={theme.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="name@company.com"
                placeholderTextColor={theme.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Password</ThemedText>
              <TouchableOpacity>
                <ThemedText style={[styles.forgotText, { color: theme.primary }]}>Forgot?</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <IconSymbol name="lock.fill" size={20} color={theme.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="••••••••"
                placeholderTextColor={theme.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <IconSymbol 
                  name={showPassword ? "eye.slash.fill" : "eye.fill"} 
                  size={20} 
                  color={theme.textTertiary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary, ...Shadows.md }]} 
            onPress={handleLogin} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Sign In</ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ThemedText style={[styles.dividerText, { color: theme.textTertiary }]}>OR</ThemedText>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity style={[styles.socialButton, { borderColor: theme.border }]}>
            <IconSymbol name="person.crop.circle" size={20} color={theme.text} />
            <ThemedText style={[styles.socialButtonText, { color: theme.text }]}>Continue with SSO</ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.footer} onPress={navigateToSignup}>
          <ThemedText style={{ color: theme.textSecondary }}>Don't have an account? </ThemedText>
          <ThemedText style={[styles.link, { color: theme.primary }]}>Create one</ThemedText>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 1.5,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  socialButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl * 1.5,
  },
  link: {
    fontWeight: '700',
  },
});