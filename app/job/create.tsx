import React, { useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Alert, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { jobService, JobType } from '@/services/jobService';
import { subscriptionService } from '@/services/subscriptionService';
import { locationService } from '@/services/locationService';
import { useAppSelector } from '@/hooks/useRedux';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CreateJobScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    salaryMin: '',
    salaryMax: '',
    type: 'Full-time' as JobType,
    description: '',
    logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=JC',
    remote: false,
    applyUrl: '',
    tags: '',
  });

  const [gettingLocation, setGettingLocation] = useState(false);

  const fetchCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      const location = await locationService.getCurrentLocation();
      if (location) {
        setFormData(prev => ({
          ...prev,
          location: location.city || location.address || '',
          latitude: location.latitude,
          longitude: location.longitude
        }));
      } else {
        Alert.alert('Error', 'Could not get your current location.');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Failed to get location.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.company || !formData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a job');
      return;
    }

    try {
      setLoading(true);
      
      // Check subscription limits
      const employerJobs = await jobService.getJobsByEmployer(user.uid);
      const canPost = await subscriptionService.checkJobLimit(user.uid, employerJobs.length);
      
      if (!canPost) {
        setLoading(false);
        Alert.alert(
          'Job Limit Reached',
          'You have reached the limit for your current plan. Please upgrade to post more jobs.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade Plan', onPress: () => router.push('/employer/subscription') }
          ]
        );
        return;
      }

      await jobService.createJob({
        ...formData,
        salaryMin: parseInt(formData.salaryMin) || 0,
        salaryMax: parseInt(formData.salaryMax) || 0,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        employerId: user.uid,
      } as any);
      Alert.alert('Success', 'Job posted successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create job');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const jobTypes: JobType[] = ['Full-time', 'Part-time', 'Contract', 'Internship'];

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ 
        title: '',
        headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.headerCircleButton, { backgroundColor: theme.surface, ...Shadows.sm, marginLeft: Spacing.md }]}
          >
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSpacer} />
        
        <View style={styles.pageHeader}>
          <ThemedText type="title" style={{ color: theme.text }}>Post a Job</ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>Find your next great hire</ThemedText>
        </View>

        <View style={styles.formSection}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Job Title *</ThemedText>
          <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <IconSymbol name="briefcase.fill" size={18} color={theme.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g. Senior React Developer"
              placeholderTextColor={theme.textTertiary}
            />
          </View>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Company Name *</ThemedText>
          <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <IconSymbol name="building.2.fill" size={18} color={theme.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={formData.company}
              onChangeText={(text) => setFormData({ ...formData, company: text })}
              placeholder="e.g. Acme Inc"
              placeholderTextColor={theme.textTertiary}
            />
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Location</ThemedText>
            <TouchableOpacity onPress={fetchCurrentLocation} disabled={gettingLocation} style={styles.locationAction}>
              {gettingLocation ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <IconSymbol name="location.fill" size={14} color={theme.primary} />
                  <ThemedText style={[styles.useCurrentLocationText, { color: theme.primary }]}>Use GPS</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <IconSymbol name="mappin.and.ellipse" size={18} color={theme.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="e.g. New York, NY"
              placeholderTextColor={theme.textTertiary}
            />
          </View>

          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.checkboxContainer, { backgroundColor: formData.remote ? theme.primary + '10' : theme.surface, borderColor: formData.remote ? theme.primary : theme.border }]} 
              onPress={() => setFormData({ ...formData, remote: !formData.remote })}
            >
              <IconSymbol 
                name={formData.remote ? "checkmark.circle.fill" : "circle"} 
                size={22} 
                color={formData.remote ? theme.primary : theme.textTertiary} 
              />
              <ThemedText style={[styles.checkboxLabel, { color: theme.text, fontWeight: formData.remote ? '700' : '500' }]}>Remote Position</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Min Salary ($)</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <IconSymbol name="dollarsign.circle.fill" size={18} color={theme.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={formData.salaryMin}
                  onChangeText={(text) => setFormData({ ...formData, salaryMin: text.replace(/[^0-9]/g, '') })}
                  placeholder="80k"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.halfInput}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Max Salary ($)</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <IconSymbol name="dollarsign.circle.fill" size={18} color={theme.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={formData.salaryMax}
                  onChangeText={(text) => setFormData({ ...formData, salaryMax: text.replace(/[^0-9]/g, '') })}
                  placeholder="120k"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Apply URL (External)</ThemedText>
          <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <IconSymbol name="link" size={18} color={theme.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={formData.applyUrl}
              onChangeText={(text) => setFormData({ ...formData, applyUrl: text })}
              placeholder="https://company.com/careers"
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="none"
            />
          </View>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Tags (comma separated)</ThemedText>
          <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <IconSymbol name="tag.fill" size={18} color={theme.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={formData.tags}
              onChangeText={(text) => setFormData({ ...formData, tags: text })}
              placeholder="React, TypeScript, Remote"
              placeholderTextColor={theme.textTertiary}
            />
          </View>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Job Type</ThemedText>
          <View style={styles.typeContainer}>
            {jobTypes.map((type) => {
              const isActive = formData.type === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton, 
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isActive && { backgroundColor: theme.primary + '10', borderColor: theme.primary }
                  ]}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <ThemedText style={[
                    styles.typeButtonText, 
                    { color: theme.textSecondary },
                    isActive && { color: theme.primary, fontWeight: '700' }
                  ]}>
                    {type}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Job Description *</ThemedText>
          <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <IconSymbol name="text.alignleft" size={18} color={theme.textTertiary} style={[styles.inputIcon, { marginTop: 12 }]} />
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text }]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe the role and responsibilities..."
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={6}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: theme.primary, ...Shadows.md }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.submitButtonText}>Post Job</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSpacer: {
    height: Platform.OS === 'ios' ? 100 : 80,
  },
  headerCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
  },
  pageHeader: {
    marginBottom: Spacing.xl,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  useCurrentLocationText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: Spacing.sm,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  halfInput: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
