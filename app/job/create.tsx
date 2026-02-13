import React, { useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { jobService, JobType } from '@/services/jobService';
import { subscriptionService } from '@/services/subscriptionService';
import { locationService } from '@/services/locationService';
import { useAppSelector } from '@/hooks/useRedux';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function CreateJobScreen() {
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
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Post a New Job', headerTransparent: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="subtitle" style={styles.label}>Job Title *</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          placeholder="e.g. Senior React Developer"
        />

        <ThemedText type="subtitle" style={styles.label}>Company Name *</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.company}
          onChangeText={(text) => setFormData({ ...formData, company: text })}
          placeholder="e.g. Acme Inc"
        />

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.label}>Location</ThemedText>
          <TouchableOpacity onPress={fetchCurrentLocation} disabled={gettingLocation}>
            {gettingLocation ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <ThemedText style={styles.useCurrentLocationText}>Use Current Location</ThemedText>
            )}
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
          placeholder="e.g. New York, NY"
        />

        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setFormData({ ...formData, remote: !formData.remote })}
          >
            <IconSymbol 
              name={formData.remote ? "checkmark.square.fill" : "square"} 
              size={24} 
              color={formData.remote ? "#007AFF" : "#666"} 
            />
            <ThemedText style={styles.checkboxLabel}>Remote Position</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <ThemedText type="subtitle" style={styles.label}>Min Salary ($)</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.salaryMin}
              onChangeText={(text) => setFormData({ ...formData, salaryMin: text.replace(/[^0-9]/g, '') })}
              placeholder="e.g. 80000"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <ThemedText type="subtitle" style={styles.label}>Max Salary ($)</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.salaryMax}
              onChangeText={(text) => setFormData({ ...formData, salaryMax: text.replace(/[^0-9]/g, '') })}
              placeholder="e.g. 120000"
              keyboardType="numeric"
            />
          </View>
        </View>

        <ThemedText type="subtitle" style={styles.label}>Apply URL (External)</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.applyUrl}
          onChangeText={(text) => setFormData({ ...formData, applyUrl: text })}
          placeholder="https://company.com/careers/job"
          autoCapitalize="none"
        />

        <ThemedText type="subtitle" style={styles.label}>Tags (comma separated)</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.tags}
          onChangeText={(text) => setFormData({ ...formData, tags: text })}
          placeholder="React, TypeScript, Remote"
        />

        <ThemedText type="subtitle" style={styles.label}>Job Type</ThemedText>
        <View style={styles.typeContainer}>
          {jobTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, formData.type === type && styles.typeButtonActive]}
              onPress={() => setFormData({ ...formData, type })}
            >
              <ThemedText style={[styles.typeButtonText, formData.type === type && styles.typeButtonTextActive]}>
                {type}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <ThemedText type="subtitle" style={styles.label}>Job Description *</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Describe the role and responsibilities..."
          multiline
          numberOfLines={6}
        />

        <TouchableOpacity 
          style={styles.submitButton} 
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
  scrollContent: {
    padding: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  useCurrentLocationText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  halfInput: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
