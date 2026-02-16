import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  View, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { clearError, register } from '@/store/authSlice';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'employer' | 'seeker'>('seeker');
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
      Alert.alert('Registration Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSignup = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters');
      return;
    }

    dispatch(register({ email, password, role }));
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color={theme.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Join thousands of professionals and companies
            </ThemedText>
          </View>

          <View style={styles.roleSelection}>
            <ThemedText style={[styles.label, { color: theme.textSecondary, marginBottom: 12 }]}>I am a...</ThemedText>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[
                  styles.roleButton, 
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  role === 'seeker' && { borderColor: theme.primary, backgroundColor: theme.primary + '05' }
                ]} 
                onPress={() => setRole('seeker')}
              >
                <View style={[styles.roleIcon, { backgroundColor: role === 'seeker' ? theme.primary : theme.textTertiary + '20' }]}>
                  <IconSymbol name="person.fill" size={20} color={role === 'seeker' ? '#fff' : theme.textSecondary} />
                </View>
                <ThemedText style={[styles.roleButtonText, { color: theme.text }, role === 'seeker' && { color: theme.primary, fontWeight: '700' }]}>
                  Job Seeker
                </ThemedText>
                {role === 'seeker' && <IconSymbol name="checkmark.circle.fill" size={18} color={theme.primary} />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.roleButton, 
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  role === 'employer' && { borderColor: theme.primary, backgroundColor: theme.primary + '05' }
                ]} 
                onPress={() => setRole('employer')}
              >
                <View style={[styles.roleIcon, { backgroundColor: role === 'employer' ? theme.primary : theme.textTertiary + '20' }]}>
                  <IconSymbol name="building.2.fill" size={20} color={role === 'employer' ? '#fff' : theme.textSecondary} />
                </View>
                <ThemedText style={[styles.roleButtonText, { color: theme.text }, role === 'employer' && { color: theme.primary, fontWeight: '700' }]}>
                  Employer
                </ThemedText>
                {role === 'employer' && <IconSymbol name="checkmark.circle.fill" size={18} color={theme.primary} />}
              </TouchableOpacity>
            </View>
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
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Password</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <IconSymbol name="lock.fill" size={20} color={theme.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="At least 6 characters"
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

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Confirm Password</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <IconSymbol name="lock.fill" size={20} color={theme.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Repeat your password"
                  placeholderTextColor={theme.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary, ...Shadows.md }]} 
              onPress={handleSignup} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Create Account</ThemedText>
              )}
            </TouchableOpacity>

            <ThemedText style={[styles.termsText, { color: theme.textTertiary }]}>
              By signing up, you agree to our <ThemedText style={{ color: theme.primary }}>Terms of Service</ThemedText> and <ThemedText style={{ color: theme.primary }}>Privacy Policy</ThemedText>.
            </ThemedText>
          </View>

          <TouchableOpacity style={styles.footer} onPress={navigateToLogin}>
            <ThemedText style={{ color: theme.textSecondary }}>Already have an account? </ThemedText>
            <ThemedText style={[styles.link, { color: theme.primary }]}>Sign In</ThemedText>
          </TouchableOpacity>
        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  roleSelection: {
    marginBottom: Spacing.xl,
  },
  roleContainer: {
    gap: Spacing.md,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    gap: 12,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
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
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  link: {
    fontWeight: '700',
  },
});