import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, logoutUser } from '@/services/firebase';
import { StyledText } from '@/components/themed-text';
import { StyledView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <StyledView style={styles.centerContent}>
        <ActivityIndicator size="large" color={Colors.dark.tint} />
      </StyledView>
    );
  }

  return (
    <StyledView style={styles.container}>
      <StyledView style={styles.header}>
        <StyledText type="title">Profile</StyledText>
      </StyledView>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarPlaceholder}>
            <IconSymbol name="person.fill" size={60} color={Colors.dark.background} />
          </View>
          <StyledText type="body" style={styles.userName}>
            {user?.email?.split('@')[0] || 'User'}
          </StyledText>
          <StyledText style={styles.userEmail}>{user?.email}</StyledText>
        </View>

        <View style={styles.section}>
          <StyledText type="body" style={styles.sectionTitle}>Account Information</StyledText>
          <View style={styles.infoRow}>
            <IconSymbol name="envelope.fill" size={20} color={Colors.dark.icon} />
            <View style={styles.infoText}>
              <StyledText type="body">Email</StyledText>
              <StyledText style={styles.infoDetailText}>{user?.email}</StyledText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol name="number" size={20} color={Colors.dark.icon} />
            <View style={styles.infoText}>
              <StyledText type="body">User ID</StyledText>
              <StyledText numberOfLines={1} ellipsizeMode="tail" style={styles.infoDetailText}>{user?.uid}</StyledText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <StyledText type="body" style={styles.sectionTitle}>Settings</StyledText>
          <TouchableOpacity style={styles.menuItem}>
            <IconSymbol name="pencil" size={20} color={Colors.dark.icon} />
            <StyledText style={styles.menuItemText}>Edit Profile</StyledText>
            <IconSymbol name="chevron.right" size={20} color={Colors.dark.icon} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <StyledText style={styles.logoutText}>Logout</StyledText>
        </TouchableOpacity>
      </ScrollView>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    textTransform: 'capitalize',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userEmail: {
    opacity: 0.6,
    marginTop: 2,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 15,
    opacity: 0.8,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
    backgroundColor: Colors.dark.card,
    padding: 15,
    borderRadius: 10,
  },
  infoText: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    gap: 15,
  },
  menuItemText: {
    flex: 1,
  },
  logoutButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#c2232325',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c22323',
  },
  logoutText: {
    color: Colors.dark.danger,
    fontWeight: '600',
  },
  infoDetailText: {
    opacity: 0.7,
  },
});
