import React, { useEffect, useState, useCallback } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  View, 
  RefreshControl 
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { JobCard } from '@/components/JobCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSelector } from '@/hooks/useRedux';
import { Job, jobService } from '@/services/jobService';

export default function SavedJobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAppSelector((state) => state.auth);

  const loadSavedJobs = async () => {
    if (!user) return;
    
    try {
      const data = await jobService.getSavedJobs(user.uid);
      setJobs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load saved jobs');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload saved jobs when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedJobs();
    }, [user?.uid])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadSavedJobs();
  };

  const renderItem = ({ item }: { item: Job }) => <JobCard job={item} />;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Saved Jobs</ThemedText>
        <ThemedText style={styles.subtitle}>Jobs you've bookmarked</ThemedText>
      </ThemedView>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ThemedText>{error}</ThemedText>
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.centerContainer}>
          <ThemedText type="subtitle" style={styles.emptyTitle}>No saved jobs yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Jobs you save will appear here</ThemedText>
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
          }
        />
      )}
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
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#666',
    textAlign: 'center',
  },
});
