import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Job, jobService } from '@/services/jobService';
import { JobApplication, applicationService } from '@/services/applicationService';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

export default function JobApplicationsScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchData();
    }
  }, [jobId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobData, appsData] = await Promise.all([
        jobService.getJobById(jobId),
        applicationService.getJobApplications(jobId)
      ]);
      
      if (jobData) setJob(jobData);
      setApplications(appsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId: string, status: JobApplication['status']) => {
    try {
      setUpdatingId(appId);
      await applicationService.updateApplicationStatus(appId, status);
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === appId ? { ...app, status } : app
      ));
      
      Alert.alert('Success', `Application status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const openResume = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this resume link');
      }
    } catch (error) {
      console.error('Error opening resume:', error);
      Alert.alert('Error', 'Failed to open resume');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'reviewed': return '#007AFF';
      case 'accepted': return '#34C759';
      case 'rejected': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const formatDate = (date?: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const renderApplication = ({ item }: { item: JobApplication }) => (
    <View style={styles.appCard}>
      <View style={styles.appHeader}>
        <View style={styles.applicantInfo}>
          <ThemedText style={styles.applicantName}>{item.seekerName}</ThemedText>
          <ThemedText style={styles.applicantEmail}>{item.seekerEmail}</ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <ThemedText style={styles.statusText}>{item.status}</ThemedText>
        </View>
      </View>

      {item.note && (
        <View style={styles.noteContainer}>
          <ThemedText style={styles.noteLabel}>Note from applicant:</ThemedText>
          <ThemedText style={styles.noteText}>{item.note}</ThemedText>
        </View>
      )}

      <View style={styles.resumeSection}>
        <TouchableOpacity 
          style={styles.resumeButton} 
          onPress={() => openResume(item.resumeUrl)}
        >
          <IconSymbol name="doc.fill" size={18} color="#007AFF" />
          <ThemedText style={styles.resumeButtonText}>View Resume</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.appliedDate}>Applied: {formatDate(item.createdAt)}</ThemedText>
      </View>

      <View style={styles.actions}>
        {item.status === 'pending' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.reviewButton]}
            onPress={() => handleUpdateStatus(item.id!, 'reviewed')}
            disabled={updatingId === item.id}
          >
            <ThemedText style={styles.actionButtonText}>Mark Reviewed</ThemedText>
          </TouchableOpacity>
        )}
        
        {item.status !== 'accepted' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleUpdateStatus(item.id!, 'accepted')}
            disabled={updatingId === item.id}
          >
            <ThemedText style={styles.actionButtonText}>Accept</ThemedText>
          </TouchableOpacity>
        )}

        {item.status !== 'rejected' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleUpdateStatus(item.id!, 'rejected')}
            disabled={updatingId === item.id}
          >
            <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      {updatingId === item.id && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#007AFF" />
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Applications' }} />
        <View style={styles.jobHeader}>
          <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
          <Skeleton width="30%" height={16} />
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.appCard}>
              <View style={styles.appHeader}>
                <View style={{ flex: 1 }}>
                  <Skeleton width="50%" height={18} style={{ marginBottom: 8 }} />
                  <Skeleton width="70%" height={14} />
                </View>
                <Skeleton width={80} height={24} borderRadius={12} />
              </View>
              <Skeleton width="100%" height={60} style={{ marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Skeleton width="30%" height={36} />
                <Skeleton width="30%" height={36} />
                <Skeleton width="30%" height={36} />
              </View>
            </View>
          ))}
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Applications',
          headerBackTitle: 'Back',
        }} 
      />
      
      <View style={styles.jobHeader}>
        <ThemedText type="title" style={styles.jobTitle}>{job?.title}</ThemedText>
        <ThemedText style={styles.jobInfo}>{applications.length} Applicants</ThemedText>
      </View>

      {applications.length > 0 ? (
        <FlatList
          data={applications}
          renderItem={renderApplication}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState 
          icon="person.2.fill"
          title="No applications yet"
          message="We'll notify you as soon as someone applies for this position."
          style={{ marginTop: 60 }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobHeader: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  jobInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  appCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  applicantEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  noteContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  resumeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resumeButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  appliedDate: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: '#007AFF',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});
