import { StyledText } from '@/components/themed-text';
import { StyledView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { loginUser } from '@/services/firebase';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <StyledView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <StyledText type="title" style={styles.title}>
          Welcome Back
        </StyledText>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#ffff"

        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#ffff"

        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <StyledText type="button">Login</StyledText>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkContainer}
          onPress={navigateToSignup}
        >
          <StyledText type="body">Don't have an account? </StyledText>
          <StyledText type="button">Sign up</StyledText>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
    color:'#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    color: 'white',
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
     color:'#ffff',
    marginTop: 10,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
         color:'#ffff',

  },
});
