import React, { useEffect, useState, useCallback } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Modal, 
  Switch,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

import { JobCard } from '@/components/JobCard';
import { SearchBar } from '@/components/SearchBar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';
import { Job, jobService, JobType } from '@/services/jobService';
import { locationService, LocationData } from '@/services/locationService';
import { userService } from '@/services/userService';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function JobsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [jobs, setJobs] = useState<Job[]>([]);
  const [suggestedJobs, setSuggestedJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<{
    location: string;
    remote?: boolean;
    type?: JobType;
    tags: string[];
  }>({ location: '', tags: [] });

  const { user } = useAppSelector((state) => state.auth);
  const isEmployer = user?.role === 'employer';

  const COMMON_TAGS = ['React', 'TypeScript', 'Node.js', 'Python', 'Design', 'Marketing', 'Sales'];

  useEffect(() => {
    handleLocationAndSuggestions();
  }, []);

  const handleLocationAndSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
        
        // Save to profile if logged in
        if (user?.uid) {
          await userService.updateProfile(user.uid, {
            locationData: {
              ...location,
              lastUpdated: Timestamp.now()
            }
          });
        }

        // Fetch suggestions
        const suggestions = await jobService.getSuggestedJobs(location.latitude, location.longitude);
        setSuggestedJobs(suggestions);
      }
    } catch (err) {
      console.error('Error in handleLocationAndSuggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    loadJobs(true);
  }, [filters.remote, filters.type, filters.tags, filters.location]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredJobs(jobs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = jobs.filter(
        job => 
          job.title.toLowerCase().includes(query) || 
          job.company.toLowerCase().includes(query)
      );
      setFilteredJobs(filtered);
    }
  }, [jobs, searchQuery]);

  const loadJobs = async (reset: boolean = false) => {
    if (loading || (loadingMore && !reset)) return;
    
    try {
      if (reset) {
        setLoading(true);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      const result = await jobService.getJobs(
        reset ? undefined : lastVisible || undefined,
        10,
        {
          ...filters,
          location: filters.location || undefined
        }
      );
      
      if (reset) {
        setJobs(result.jobs);
      } else {
        setJobs(prev => [...prev, ...result.jobs]);
      }
      
      setLastVisible(result.lastVisible);
      setHasMore(result.jobs.length === 10);
      setError(null);
    } catch (err) {
      setError('Failed to load jobs');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadJobs(true);
  }, [filters.remote, filters.type, filters.tags, filters.location]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      loadJobs(false);
    }
  };

  const navigateToCreateJob = () => {
    router.push('/job/create');
  };

  const handleSaveSearch = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to save your search.');
      return;
    }

    try {
      await jobService.saveSearch(user.uid, {
        query: searchQuery,
        filters: {
          ...filters,
          location: filters.location || undefined
        }
      });
      Alert.alert('Search Saved', "You'll be notified when new jobs matching your search are posted!");
    } catch (error) {
      console.error('Error saving search:', error);
      Alert.alert('Error', 'Failed to save search.');
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  };

  const renderItem = ({ item }: { item: Job }) => <JobCard job={item} />;

  const renderHeader = () => {
    if (suggestedJobs.length === 0 && !loadingSuggestions) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Suggested for You</ThemedText>
          <TouchableOpacity>
            <ThemedText style={[styles.seeAll, { color: theme.primary }]}>See All</ThemedText>
          </TouchableOpacity>
        </View>
        
        {loadingSuggestions ? (
          <View style={styles.suggestionList}>
            {[1, 2].map(i => (
              <View key={i} style={[styles.suggestionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Skeleton width="40%" height={12} style={{ marginBottom: 8 }} />
                <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
                <Skeleton width="60%" height={12} />
              </View>
            ))}
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionList}
          >
            {suggestedJobs.map(job => (
              <TouchableOpacity 
                key={job.id} 
                style={[styles.suggestionCard, { backgroundColor: theme.surface, borderColor: theme.border, ...Shadows.sm }]}
                onPress={() => router.push(`/job/${job.id}`)}
              >
                <View style={styles.suggestionHeader}>
                  <Image 
                    source={{ uri: `https://logo.clearbit.com/${job.company.toLowerCase().replace(/\s+/g, '')}.com` }} 
                    style={[styles.suggestionLogo, { backgroundColor: theme.background }]}
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                  <View style={styles.suggestionInfo}>
                    <ThemedText style={[styles.suggestionTitle, { color: theme.text }]} numberOfLines={1}>
                      {job.title}
                    </ThemedText>
                    <ThemedText style={[styles.suggestionCompany, { color: theme.textSecondary }]} numberOfLines={1}>
                      {job.company}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.suggestionDetails}>
                  <View style={styles.suggestionDetailItem}>
                    <IconSymbol name="mappin.and.ellipse" size={12} color={theme.textTertiary} />
                    <ThemedText style={[styles.suggestionDetailText, { color: theme.textSecondary }]}>
                      {job.location}
                    </ThemedText>
                  </View>
                  <View style={styles.suggestionDetailItem}>
                    <IconSymbol name="briefcase" size={12} color={theme.textTertiary} />
                    <ThemedText style={[styles.suggestionDetailText, { color: theme.textSecondary }]}>
                      {job.type}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.suggestionFooter}>
                  <ThemedText style={[styles.suggestionSalary, { color: theme.primary }]}>
                    {job.salaryRange || '$80k - $120k'}
                  </ThemedText>
                  <IconSymbol name="chevron.right" size={16} color={theme.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const JobTypeFilter = ({ type }: { type: JobType }) => (
    <TouchableOpacity 
      style={[
        styles.tag, 
        { borderColor: theme.border },
        filters.type === type && { backgroundColor: theme.primary, borderColor: theme.primary }
      ]}
      onPress={() => setFilters(prev => ({ ...prev, type: prev.type === type ? undefined : type }))}
    >
      <ThemedText style={[
        styles.tagText, 
        { color: theme.textSecondary },
        filters.type === type && { color: '#fff' }
      ]}>
        {type}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <ThemedText style={[styles.greeting, { color: theme.textSecondary }]}>Hello, {user?.displayName?.split(' ')[0] || 'there'} 👋</ThemedText>
            <ThemedText type="title" style={[styles.title, { color: theme.text }]}>Find Your Next Opportunity</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.circleButton, { backgroundColor: theme.surface, ...Shadows.sm }]}>
              <IconSymbol name="bell" size={20} color={theme.text} />
              <View style={[styles.notificationDot, { backgroundColor: theme.error }]} />
            </TouchableOpacity>
            {isEmployer && (
               <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: theme.primary, ...Shadows.md }]} 
                onPress={navigateToCreateJob}
              >
                 <IconSymbol name="plus" size={24} color="#fff" />
               </TouchableOpacity>
             )}
          </View>
        </View>
      </View>
      
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <SearchBar 
            placeholder="Search roles, companies..."
            onSearch={setSearchQuery} 
          />
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: theme.primary, ...Shadows.md }]} 
            onPress={() => setIsFilterModalVisible(true)}
          >
            <IconSymbol name="slider.horizontal.3" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {(searchQuery.length > 0 || filters.location || filters.tags.length > 0) && !isEmployer && (
          <TouchableOpacity 
            style={[styles.saveSearchButton, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}
            onPress={handleSaveSearch}
          >
            <IconSymbol name="bell.badge.fill" size={14} color={theme.primary} />
            <ThemedText style={[styles.saveSearchText, { color: theme.primary }]}>Alert me for new matches</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.listContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.skeletonCard, { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
              <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
              <Skeleton width="80%" height={24} style={{ marginBottom: 12 }} />
              <Skeleton width="60%" height={16} />
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <ThemedText>{error}</ThemedText>
          <TouchableOpacity style={[styles.applyButton, { width: 120, height: 44 }]} onPress={() => loadJobs(true)}>
            <ThemedText style={styles.buttonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : filteredJobs.length === 0 ? (
        <EmptyState 
          icon="magnifyingglass"
          title="No jobs found"
          message="Try adjusting your search or filters to find what you're looking for."
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Filters</ThemedText>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <ThemedText style={[styles.filterLabel, { color: theme.text }]}>Location</ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  placeholder="e.g. San Francisco, Remote"
                  placeholderTextColor={theme.textTertiary}
                  value={filters.location}
                  onChangeText={(val) => setFilters(prev => ({ ...prev, location: val }))}
                />
              </View>

              <View style={styles.filterSection}>
                <ThemedText style={[styles.filterLabel, { color: theme.text }]}>Job Type</ThemedText>
                <View style={styles.tagsContainer}>
                  {(['Full-time', 'Part-time', 'Contract', 'Internship'] as JobType[]).map(type => (
                    <JobTypeFilter key={type} type={type} />
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ThemedText style={[styles.filterLabel, { color: theme.text, marginBottom: 0 }]}>Remote Only</ThemedText>
                  <Switch
                    value={filters.remote}
                    onValueChange={(val) => setFilters(prev => ({ ...prev, remote: val }))}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <ThemedText style={[styles.filterLabel, { color: theme.text }]}>Skills / Tags</ThemedText>
                <View style={styles.tagsContainer}>
                  {COMMON_TAGS.map(tag => {
                    const isSelected = filters.tags.includes(tag);
                    return (
                      <TouchableOpacity 
                        key={tag}
                        style={[
                          styles.tag, 
                          { borderColor: theme.border },
                          isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}
                        onPress={() => {
                          setFilters(prev => {
                            const newTags = isSelected 
                              ? prev.tags.filter(t => t !== tag)
                              : [...prev.tags, tag];
                            return { ...prev, tags: newTags };
                          });
                        }}
                      >
                        <ThemedText style={[
                          styles.tagText, 
                          { color: theme.textSecondary },
                          isSelected && { color: '#fff' }
                        ]}>
                          {tag}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.resetButton, { borderColor: theme.border }]}
                onPress={() => setFilters({ location: '', tags: [] })}
              >
                <ThemedText style={[styles.buttonText, { color: theme.textSecondary }]}>Reset</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.applyButton, { backgroundColor: theme.primary, ...Shadows.md }]}
                onPress={() => setIsFilterModalVisible(false)}
              >
                <ThemedText style={[styles.buttonText, { color: '#fff' }]}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    maxWidth: 240,
    lineHeight: 32,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 12,
    right: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  saveSearchText: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
  },
  suggestionList: {
    paddingHorizontal: Spacing.xl,
    gap: 16,
  },
  suggestionCard: {
    width: 280,
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  suggestionLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  suggestionCompany: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  suggestionDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  suggestionDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionDetailText: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  suggestionSalary: {
    fontSize: 14,
    fontWeight: '800',
  },
  listContainer: {
    paddingBottom: 100,
  },
  listHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center', 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  filterSection: {
    marginBottom: 28,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  resetButton: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButton: {
    flex: 2,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 100,
  },
  footerLoader: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  skeletonCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
});
