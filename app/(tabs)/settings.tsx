import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);

  const toggleNotifications = () => setIsNotificationsEnabled(previousState => !previousState);

  const SettingItem = ({ icon, label, value, onPress, isSwitch = false }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={styles.settingItemLeft}>
        <IconSymbol name={icon} size={22} color="#666" />
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      </View>
      {isSwitch ? (
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={value ? '#2196F3' : '#f4f3f4'}
          onValueChange={toggleNotifications}
          value={value}
        />
      ) : (
        <IconSymbol name="chevron.right" size={20} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Preferences</ThemedText>
        <View style={styles.section}>
          <SettingItem 
            icon="moon.fill" 
            label="Dark Mode" 
            onPress={() => {}} 
          />
          <SettingItem 
            icon="bell.fill" 
            label="Notifications" 
            isSwitch={true}
            value={isNotificationsEnabled}
          />
        </View>

        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Privacy & Security</ThemedText>
        <View style={styles.section}>
          <SettingItem 
            icon="lock.fill" 
            label="Change Password" 
            onPress={() => {}} 
          />
        </View>

        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>About</ThemedText>
        <View style={styles.section}>
          <SettingItem 
            icon="info.circle.fill" 
            label="App Version" 
            onPress={() => {}} 
          />
          <View style={styles.versionInfo}>
            <ThemedText style={styles.versionText}>v1.0.0 (Beta)</ThemedText>
          </View>
        </View>
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
  sectionTitle: {
    fontSize: 14,
    marginBottom: 10,
    marginTop: 10,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  versionInfo: {
    padding: 16,
    alignItems: 'center',
  },
  versionText: {
    opacity: 0.4,
    fontSize: 12,
  },
});
