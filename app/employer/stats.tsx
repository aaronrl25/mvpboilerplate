import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';
import { jobService, Job } from '@/services/jobService';
import { applicationService, JobApplication } from '@/services/applicationService';

const { width } = Dimensions.get('window');

interface JobStat extends Job {
  applicationCount: number;
}

export default function EmployerStatsScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [jobStats, setJobStats] = useState<JobStat[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const jobs = await jobService.getJobsByEmployer(user!.uid);
      
      let views = 0;
      let apps = 0;
      
      const stats = await Promise.all(jobs.map(async (job) => {
        const applications = await applicationService.getJobApplications(job.id!);
        views += (job.viewsCount || 0);
        apps += applications.length;
        
        return {
          ...job,
          applicationCount: applications.length
        };
      }));

      setJobStats(stats);
      setTotalViews(views);
      setTotalApplications(apps);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const conversionRate = totalViews > 0 ? ((totalApplications / totalViews) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title">Employer Stats</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
            <IconSymbol name="eye.fill" size={24} color="#1976D2" />
            <ThemedText style={styles.summaryValue}>{totalViews}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Total Views</ThemedText>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
            <IconSymbol name="person.2.fill" size={24} color="#388E3C" />
            <ThemedText style={styles.summaryValue}>{totalApplications}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Applications</ThemedText>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
            <IconSymbol name="chart.bar.fill" size={24} color="#F57C00" />
            <ThemedText style={styles.summaryValue}>{conversionRate}%</ThemedText>
            <ThemedText style={styles.summaryLabel}>Conversion</ThemedText>
          </View>
        </View>

        {/* Job Performance List */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Job Performance</ThemedText>
          {jobStats.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText>No jobs posted yet.</ThemedText>
            </View>
          ) : (
            jobStats.map((job) => (
              <TouchableOpacity 
                key={job.id} 
                style={styles.jobStatCard}
                onPress={() => router.push(`/applications/review?jobId=${job.id}`)}
              >
                <View style={styles.jobInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{job.title}</ThemedText>
                  <ThemedText style={styles.jobMeta}>{job.type} • {job.location}</ThemedText>
                </View>
                <View style={styles.jobMetrics}>
                  <View style={styles.metricItem}>
                    <ThemedText style={styles.metricValue}>{job.viewsCount || 0}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Views</ThemedText>
                  </View>
                  <View style={styles.metricItem}>
                    <ThemedText style={styles.metricValue}>{job.applicationCount}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Apps</ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Simple Visualization */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Engagement Breakdown</ThemedText>
          <View style={styles.chartPlaceholder}>
            {jobStats.map((job, index) => {
              const maxVal = Math.max(...jobStats.map(j => j.viewsCount || 0), 1);
              const barWidth = ((job.viewsCount || 0) / maxVal) * (width - 80);
              
              return (
                <View key={job.id} style={styles.barContainer}>
                  <ThemedText style={styles.barLabel} numberOfLines={1}>{job.title}</ThemedText>
                  <View style={styles.barWrapper}>
                    <View style={[styles.bar, { width: Math.max(barWidth, 2) }]} />
                    <ThemedText style={styles.barValue}>{job.viewsCount || 0}</ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  summaryCard: {
    width: (width - 60) / 3,
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  jobStatCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  jobInfo: {
    flex: 1,
    marginRight: 10,
  },
  jobMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  jobMetrics: {
    flexDirection: 'row',
    gap: 15,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 10,
    color: '#999',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  chartPlaceholder: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  barContainer: {
    marginBottom: 15,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  barValue: {
    fontSize: 10,
    color: '#999',
    marginLeft: 8,
  },
});
