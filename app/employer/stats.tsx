import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';
import { jobService, Job } from '@/services/jobService';
import { applicationService, JobApplication } from '@/services/applicationService';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { EmptyState } from '@/components/EmptyState';

const { width } = Dimensions.get('window');

interface JobStat extends Job {
  applicationCount: number;
}

export default function EmployerStatsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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
      <ThemedView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

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
          <ThemedText type="title" style={{ color: theme.text }}>Employer Insights</ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>Monitor your hiring performance</ThemedText>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, ...Shadows.md }]}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.primary + '15' }]}>
              <IconSymbol name="eye.fill" size={20} color={theme.primary} />
            </View>
            <ThemedText style={[styles.summaryValue, { color: theme.text }]}>{totalViews}</ThemedText>
            <ThemedText style={[styles.summaryLabel, { color: theme.textTertiary }]}>Total Views</ThemedText>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, ...Shadows.md }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#34C75915' }]}>
              <IconSymbol name="person.2.fill" size={20} color="#34C759" />
            </View>
            <ThemedText style={[styles.summaryValue, { color: theme.text }]}>{totalApplications}</ThemedText>
            <ThemedText style={[styles.summaryLabel, { color: theme.textTertiary }]}>Applications</ThemedText>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, ...Shadows.md }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FF950015' }]}>
              <IconSymbol name="chart.bar.fill" size={20} color="#FF9500" />
            </View>
            <ThemedText style={[styles.summaryValue, { color: theme.text }]}>{conversionRate}%</ThemedText>
            <ThemedText style={[styles.summaryLabel, { color: theme.textTertiary }]}>Conversion</ThemedText>
          </View>
        </View>

        {/* Reach Card */}
        <View style={[styles.reachCard, { backgroundColor: theme.primary, ...Shadows.md }]}>
          <View style={styles.reachInfo}>
            <ThemedText style={styles.reachTitle}>Talent Reach</ThemedText>
            <ThemedText style={styles.reachSubtitle}>Your jobs are performing well!</ThemedText>
          </View>
          <View style={styles.reachStats}>
            <ThemedText style={styles.reachValue}>+{Math.round(totalViews / 7)}</ThemedText>
            <ThemedText style={styles.reachLabel}>this week</ThemedText>
          </View>
        </View>

        {/* Job Performance List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: theme.text }]}>Job Performance</ThemedText>
          </View>
          {jobStats.length === 0 ? (
            <EmptyState
              icon="doc.text.magnify"
              title="No jobs posted"
              message="Post your first job to start seeing analytics."
            />
          ) : (
            jobStats.map((job) => (
              <TouchableOpacity 
                key={job.id} 
                style={[styles.jobStatCard, { backgroundColor: theme.surface, borderColor: theme.border, ...Shadows.sm }]}
                onPress={() => router.push(`/employer/applications/${job.id}`)}
              >
                <View style={styles.jobInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1} style={{ color: theme.text }}>{job.title}</ThemedText>
                  <ThemedText style={[styles.jobMeta, { color: theme.textSecondary }]}>{job.type} • {job.location}</ThemedText>
                </View>
                <View style={styles.jobMetrics}>
                  <View style={styles.metricItem}>
                    <ThemedText style={[styles.metricValue, { color: theme.text }]}>{job.viewsCount || 0}</ThemedText>
                    <ThemedText style={[styles.metricLabel, { color: theme.textTertiary }]}>Views</ThemedText>
                  </View>
                  <View style={styles.metricItem}>
                    <ThemedText style={[styles.metricValue, { color: theme.text }]}>{job.applicationCount}</ThemedText>
                    <ThemedText style={[styles.metricLabel, { color: theme.textTertiary }]}>Apps</ThemedText>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={theme.textTertiary} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Simple Visualization */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: theme.text }]}>Engagement Breakdown</ThemedText>
          <View style={[styles.chartContainer, { backgroundColor: theme.surface, ...Shadows.sm }]}>
            {jobStats.length === 0 ? (
              <ThemedText style={{ color: theme.textTertiary, textAlign: 'center', padding: Spacing.xl }}>
                No data to visualize
              </ThemedText>
            ) : (
              jobStats.map((job, index) => {
                const maxVal = Math.max(...jobStats.map(j => j.viewsCount || 0), 1);
                const barWidth = ((job.viewsCount || 0) / maxVal) * (width - Spacing.xl * 4 - 80);
                
                return (
                  <View key={job.id} style={styles.barContainer}>
                    <ThemedText style={[styles.barLabel, { color: theme.textSecondary }]} numberOfLines={1}>{job.title}</ThemedText>
                    <View style={styles.barWrapper}>
                      <View style={[styles.bar, { width: Math.max(barWidth, 4), backgroundColor: theme.primary }]} />
                      <ThemedText style={[styles.barValue, { color: (barWidth > (width - 200)) ? '#fff' : theme.textSecondary }]}>
                        {job.viewsCount || 0}
                      </ThemedText>
                    </View>
                  </View>
                );
              })
            )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
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
  pageHeader: {
    marginBottom: Spacing.xl,
  },
  reachCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  reachInfo: {
    flex: 1,
  },
  reachTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  reachSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  reachStats: {
    alignItems: 'flex-end',
  },
  reachValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  reachLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  jobStatCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  jobInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  jobMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  jobMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  chartContainer: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  barContainer: {
    marginBottom: Spacing.lg,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderRadius: 6,
    flex: 1,
  },
  bar: {
    height: 12,
    borderRadius: 6,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: Spacing.sm,
    position: 'absolute',
    right: 10,
  },
});
