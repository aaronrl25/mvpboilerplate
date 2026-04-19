import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Switch, View } from 'react-native';

import { StyledText } from '@/components/themed-text';
import { StyledView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function SettingsScreen() {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);

  const toggleNotifications = () => setIsNotificationsEnabled(previousState => !previousState);

  const SettingItem = ({ icon, label, value, onPress, isSwitch = false }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={styles.settingItemLeft}>
        <IconSymbol name={icon} size={22} color={Colors.dark.text} />
        <StyledText style={styles.settingLabel}>{label}</StyledText>
      </View>
      {isSwitch ? (
        <Switch
          trackColor={{ false: '#767577', true: Colors.dark.tint }}
          thumbColor={value ? Colors.dark.tint : '#f4f3f4'}
          onValueChange={toggleNotifications}
          value={value}
        />
      ) : (
        <IconSymbol name="chevron.right" size={20} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <StyledView style={styles.container}>
      <StyledView style={styles.header}>
        <StyledText type="title">Settings</StyledText>
      </StyledView>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <StyledText type="caption" style={styles.sectionTitle}>Preferences</StyledText>
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

        <StyledText type="caption" style={styles.sectionTitle}>Privacy & Security</StyledText>
        <View style={styles.section}>
          <SettingItem 
            icon="lock.fill" 
            label="Change Password" 
            onPress={() => {}} 
          />
        </View>

        <StyledText type="caption" style={styles.sectionTitle}>About</StyledText>
        <View style={styles.section}>
          <SettingItem 
            icon="info.circle.fill" 
            label="App Version" 
            onPress={() => {}} 
          />
          <View style={styles.versionInfo}>
            <StyledText style={styles.versionText}>v1.0.0 (Beta)</StyledText>
          </View>
        </View>
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
  sectionTitle: {
    fontSize: 14,
    marginBottom: 10,
    marginTop: 10,
    opacity: 0.6,
    textTransform: 'uppercase',
    color: Colors.dark.text,
  },
  section: {
    backgroundColor: Colors.dark.card,
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
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  versionInfo: {
    padding: 16,
    alignItems: 'center',
  },
  versionText: {
    opacity: 0.4,
    fontSize: 12,
    color: Colors.dark.text,
  },
});
