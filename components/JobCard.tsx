import React, { useState, useEffect } from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Job, jobService } from '@/services/jobService';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';

interface JobCardProps {
  job: Job;
}

const { width } = Dimensions.get('window');

export function JobCard({ job }: JobCardProps) {
  const { user } = useAppSelector((state) => state.auth);
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

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={handlePress}>
      <View style={styles.header}>
        <Image 
          source={{ uri: job.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${job.company}` }} 
          style={styles.logo} 
        />
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {job.title}
          </ThemedText>
          <ThemedText style={styles.company} numberOfLines={1}>
            {job.company}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={toggleSave}>
          <IconSymbol 
            name={isSaved ? "bookmark.fill" : "bookmark"} 
            size={22} 
            color={isSaved ? "#007AFF" : "#666"} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <IconSymbol name="mappin.and.ellipse" size={14} color="#666" />
          <ThemedText style={styles.detailText}>{job.location}{job.remote ? ' (Remote)' : ''}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="briefcase.fill" size={14} color="#666" />
          <ThemedText style={styles.detailText}>{job.type}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="dollarsign.circle" size={14} color="#666" />
          <ThemedText style={styles.detailText}>{formatSalary()}</ThemedText>
        </View>
      </View>
      
      {job.tags && job.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {job.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <ThemedText style={styles.tagText}>{tag}</ThemedText>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.footer}>
        <ThemedText style={styles.postedAt}>{formatDate()}</ThemedText>
        <TouchableOpacity style={styles.applyButton} onPress={handlePress}>
          <ThemedText style={styles.applyButtonText}>View Details</ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  postedAt: {
    fontSize: 12,
    color: '#999',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
});
