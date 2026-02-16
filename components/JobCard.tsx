import React, { useState, useEffect } from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Job, jobService } from '@/services/jobService';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';

import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const { user } = useAppSelector((state) => state.auth);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user && job.id) {
      checkSavedStatus();
    }
  }, [user, job.id]);

  const checkSavedStatus = async () => {
    if (user && job.id) {
      const saved = await jobService.isJobSaved(user.uid, job.id);
      setIsSaved(saved);
    }
  };

  const handlePress = () => {
    router.push(`/job/${job.id}`);
  };

  const toggleSave = async (e: any) => {
    e.stopPropagation();
    if (!user || !job.id) return;

    try {
      if (isSaved) {
        await jobService.unsaveJob(user.uid, job.id);
        setIsSaved(false);
      } else {
        await jobService.saveJob(user.uid, job.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const formatSalary = () => {
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin / 1000}k - $${job.salaryMax / 1000}k`;
    }
    return 'Salary not specified';
  };

  const formatDate = () => {
    if (!job.postedAt) return '';
    const date = job.postedAt.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const isNew = () => {
    if (!job.postedAt) return false;
    const date = job.postedAt.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days <= 2;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.surface,
          borderColor: theme.border,
          ...Shadows.sm 
        }
      ]} 
      activeOpacity={0.7} 
      onPress={handlePress}
    >
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: theme.background }]}>
          <Image 
            source={{ uri: job.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${job.company}` }} 
            style={styles.logo} 
          />
        </View>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {job.title}
            </ThemedText>
            {isNew() && (
              <View style={[styles.newBadge, { backgroundColor: theme.primary + '15' }]}>
                <ThemedText style={[styles.newBadgeText, { color: theme.primary }]}>New</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={[styles.company, { color: theme.textSecondary }]} numberOfLines={1}>
            {job.company}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={toggleSave} style={styles.saveButton}>
          <IconSymbol 
            name={isSaved ? "bookmark.fill" : "bookmark"} 
            size={22} 
            color={isSaved ? theme.primary : theme.textTertiary} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <IconSymbol name="mappin.and.ellipse" size={12} color={theme.textSecondary} />
          <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
            {job.location}
          </ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="briefcase.fill" size={12} color={theme.textSecondary} />
          <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
            {job.type}
          </ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="dollarsign.circle" size={12} color={theme.textSecondary} />
          <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
            {formatSalary()}
          </ThemedText>
        </View>
      </View>
      
      <View style={[styles.footer, { borderTopColor: theme.border + '50' }]}>
        <ThemedText style={[styles.postedAt, { color: theme.textTertiary }]}>{formatDate()}</ThemedText>
        {job.tags && job.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {job.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <ThemedText style={[styles.tagText, { color: theme.textSecondary }]}>{tag}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  titleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  company: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  saveButton: {
    padding: 4,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: Spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  postedAt: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
