import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { logout } from '@/store/authSlice';

export default function ProfileScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const ensureUserInFirestore = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.email?.split('@')[0] || 'User',
            createdAt: new Date().toISOString(),
            photoURL: user.photoURL || '',
          });
        }
      }
    };

    ensureUserInFirestore();
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarPlaceholder}>
            <IconSymbol name="person.fill" size={60} color="#fff" />
          </View>
          <ThemedText type="subtitle" style={styles.userName}>
            {user?.email?.split('@')[0] || 'User'}
          </ThemedText>
          <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Account Information</ThemedText>
          <View style={styles.infoRow}>
            <IconSymbol name="paperplane.fill" size={20} color="#666" />
            <View style={styles.infoText}>
              <ThemedText type="defaultSemiBold">Email</ThemedText>
              <ThemedText>{user?.email}</ThemedText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol name="house.fill" size={20} color="#666" />
            <View style={styles.infoText}>
              <ThemedText type="defaultSemiBold">User ID</ThemedText>
              <ThemedText numberOfLines={1} ellipsizeMode="tail">{user?.uid}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Settings</ThemedText>
          <TouchableOpacity style={styles.menuItem}>
            <IconSymbol name="gearshape.fill" size={20} color="#666" />
            <ThemedText style={styles.menuItemText}>Edit Profile</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  scrollContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    textTransform: 'capitalize',
  },
  userEmail: {
    opacity: 0.6,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 15,
    opacity: 0.8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 10,
  },
  infoText: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.03)',
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
    backgroundColor: '#FFF1F0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFA39E',
  },
  logoutText: {
    color: '#F5222D',
    fontWeight: '600',
  },
});
