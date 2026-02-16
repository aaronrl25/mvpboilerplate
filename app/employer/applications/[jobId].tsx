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
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Job, jobService } from '@/services/jobService';
import { JobApplication, applicationService } from '@/services/applicationService';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function JobApplicationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { color: '#FF9500', label: 'Pending', icon: 'clock.fill' };
      case 'reviewed': return { color: theme.primary, label: 'Reviewed', icon: 'eye.fill' };
      case 'accepted': return { color: '#34C759', label: 'Accepted', icon: 'checkmark.circle.fill' };
      case 'rejected': return { color: '#FF3B30', label: 'Rejected', icon: 'xmark.circle.fill' };
      default: return { color: theme.textTertiary, label: status, icon: 'questionmark.circle.fill' };
    }
  };

  const formatDate = (date?: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderApplication = ({ item }: { item: JobApplication }) => {
    const statusConfig = getStatusConfig(item.status);
    const initials = item.seekerName.split(' ').map(n => n[0]).join('').toUpperCase();
    
    return (
      <View style={[styles.appCard, { backgroundColor: theme.surface, borderColor: theme.border, ...Shadows.md }]}>
        <View style={styles.appHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
            <ThemedText style={[styles.avatarText, { color: theme.primary }]}>{initials}</ThemedText>
          </View>
          <View style={styles.applicantInfo}>
            <ThemedText type="defaultSemiBold" style={[styles.applicantName, { color: theme.text }]}>{item.seekerName}</ThemedText>
            <ThemedText style={[styles.applicantEmail, { color: theme.textSecondary }]}>{item.seekerEmail}</ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '10', borderColor: statusConfig.color + '30' }]}>
            <IconSymbol name={statusConfig.icon as any} size={10} color={statusConfig.color} />
            <ThemedText style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</ThemedText>
          </View>
        </View>

        {item.note && (
          <View style={[styles.noteContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.noteHeader}>
              <IconSymbol name="quote.bubble.fill" size={12} color={theme.textTertiary} />
              <ThemedText style={[styles.noteLabel, { color: theme.textTertiary }]}>Cover Note</ThemedText>
            </View>
            <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>{item.note}</ThemedText>
          </View>
        )}

        <View style={[styles.resumeSection, { borderTopColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.resumeButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={() => openResume(item.resumeUrl)}
          >
            <View style={[styles.resumeIconBox, { backgroundColor: theme.primary + '15' }]}>
              <IconSymbol name="doc.fill" size={14} color={theme.primary} />
            </View>
            <ThemedText style={[styles.resumeButtonText, { color: theme.text }]}>View Resume</ThemedText>
            <IconSymbol name="arrow.up.right" size={12} color={theme.textTertiary} />
          </TouchableOpacity>
          <ThemedText style={[styles.appliedDate, { color: theme.textTertiary }]}>{formatDate(item.createdAt)}</ThemedText>
        </View>

        <View style={styles.actions}>
          {item.status === 'pending' && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.primary, ...Shadows.sm }]}
              onPress={() => handleUpdateStatus(item.id!, 'reviewed')}
              disabled={updatingId === item.id}
            >
              <IconSymbol name="eye.fill" size={14} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Review</ThemedText>
            </TouchableOpacity>
          )}
          
          {item.status !== 'accepted' && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#34C759', ...Shadows.sm }]}
              onPress={() => handleUpdateStatus(item.id!, 'accepted')}
              disabled={updatingId === item.id}
            >
              <IconSymbol name="checkmark.circle.fill" size={14} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Accept</ThemedText>
            </TouchableOpacity>
          )}

          {item.status !== 'rejected' && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FF3B30', ...Shadows.sm }]}
              onPress={() => handleUpdateStatus(item.id!, 'rejected')}
              disabled={updatingId === item.id}
            >
              <IconSymbol name="xmark.circle.fill" size={14} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        
        {updatingId === item.id && (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.surface + 'B3' }]}>
            <ActivityIndicator color={theme.primary} />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: '' }} />
        <View style={styles.jobHeader}>
          <Skeleton width="60%" height={28} style={{ marginBottom: Spacing.xs }} />
          <Skeleton width="30%" height={16} />
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.appCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.appHeader}>
                <View style={{ flex: 1 }}>
                  <Skeleton width="50%" height={20} style={{ marginBottom: Spacing.xs }} />
                  <Skeleton width="70%" height={14} />
                </View>
                <Skeleton width={80} height={24} borderRadius={12} />
              </View>
              <Skeleton width="100%" height={60} style={{ marginBottom: Spacing.md }} borderRadius={BorderRadius.md} />
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Skeleton width="30%" height={40} borderRadius={BorderRadius.md} />
                <Skeleton width="30%" height={40} borderRadius={BorderRadius.md} />
                <Skeleton width="30%" height={40} borderRadius={BorderRadius.md} />
              </View>
            </View>
          ))}
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{ 
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
        }} 
      />
      
      <View style={styles.headerSpacer} />

      <View style={[styles.jobHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border, ...Shadows.sm }]}>
        <ThemedText type="title" style={[styles.jobTitle, { color: theme.text }]}>{job?.title}</ThemedText>
        <View style={styles.headerMeta}>
          <View style={[styles.metaIconBox, { backgroundColor: theme.primary + '15' }]}>
            <IconSymbol name="person.2.fill" size={12} color={theme.primary} />
          </View>
          <ThemedText style={[styles.jobInfo, { color: theme.textSecondary }]}>{applications.length} Candidates</ThemedText>
          <View style={[styles.dot, { backgroundColor: theme.textTertiary }]} />
          <ThemedText style={[styles.jobInfo, { color: theme.textSecondary }]}>{job?.company}</ThemedText>
        </View>
      </View>

      {applications.length > 0 ? (
        <FlatList
          data={applications}
          renderItem={renderApplication}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  jobHeader: {
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  jobInfo: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
  },
  appCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    position: 'relative',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 18,
    fontWeight: '700',
  },
  applicantEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  noteContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 22,
  },
  resumeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  resumeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  appliedDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
  },
});
