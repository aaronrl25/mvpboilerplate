import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View, TouchableOpacity, Platform } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Job, jobService } from '@/services/jobService';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const data = await jobService.getJobById(id);
        if (data) {
          setJob(data);
        } else {
          setError('Job not found');
        }
      } catch (err) {
        setError('Failed to load job details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  if (error || !job) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>{error || 'Job not found'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Job Details', headerTransparent: false }} />
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <Image source={{ uri: job.logo }} style={styles.logo} />
          <ThemedText type="title" style={styles.title}>{job.title}</ThemedText>
          <ThemedText style={styles.company}>{job.company}</ThemedText>
          
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <IconSymbol name="mappin.and.ellipse" size={14} color="#666" />
              <ThemedText style={styles.badgeText}>{job.location}</ThemedText>
            </View>
            <View style={styles.badge}>
              <IconSymbol name="briefcase.fill" size={14} color="#666" />
              <ThemedText style={styles.badgeText}>{job.type}</ThemedText>
            </View>
            <View style={styles.badge}>
              <IconSymbol name="dollarsign.circle" size={14} color="#666" />
              <ThemedText style={styles.badgeText}>{job.salary}</ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Description</ThemedText>
            <ThemedText style={styles.description}>{job.description}</ThemedText>
            <ThemedText style={styles.description}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Responsibilities</ThemedText>
            <ThemedText style={styles.bulletItem}>• Design and implement new features</ThemedText>
            <ThemedText style={styles.bulletItem}>• Collaborate with cross-functional teams</ThemedText>
            <ThemedText style={styles.bulletItem}>• Optimize application for maximum speed and scalability</ThemedText>
            <ThemedText style={styles.bulletItem}>• Participate in code reviews and mentorship</ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
      
      <ThemedView style={styles.footer}>
        <TouchableOpacity style={styles.saveButton}>
          <IconSymbol name="bookmark" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton}>
          <ThemedText style={styles.applyButtonText}>Apply for this job</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  company: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 8,
    paddingLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 16,
  },
  saveButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
