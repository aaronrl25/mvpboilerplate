import React from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Job } from '@/services/jobService';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { IconSymbol } from './ui/icon-symbol';

interface JobCardProps {
  job: Job;
}

const { width } = Dimensions.get('window');

export function JobCard({ job }: JobCardProps) {
  const handlePress = () => {
    router.push(`/job/${job.id}`);
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={handlePress}>
      <View style={styles.header}>
        <Image source={{ uri: job.logo }} style={styles.logo} />
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {job.title}
          </ThemedText>
          <ThemedText style={styles.company} numberOfLines={1}>
            {job.company}
          </ThemedText>
        </View>
        <IconSymbol name="bookmark" size={20} color="#666" />
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <IconSymbol name="mappin.and.ellipse" size={14} color="#666" />
          <ThemedText style={styles.detailText}>{job.location}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="briefcase.fill" size={14} color="#666" />
          <ThemedText style={styles.detailText}>{job.type}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="dollarsign.circle" size={14} color="#666" />
          <ThemedText style={styles.detailText}>{job.salary}</ThemedText>
        </View>
      </View>
      
      <View style={styles.footer}>
        <ThemedText style={styles.postedAt}>{job.postedAt}</ThemedText>
        <TouchableOpacity style={styles.applyButton}>
          <ThemedText style={styles.applyButtonText}>Apply Now</ThemedText>
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
});
