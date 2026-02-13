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

export default function JobsScreen() {
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
      <View style={styles.suggestionsContainer}>
        <View style={styles.suggestionsHeader}>
          <IconSymbol name="mappin.and.ellipse" size={18} color="#007AFF" />
          <ThemedText type="defaultSemiBold" style={styles.suggestionsTitle}>
            Suggested for You {userLocation?.city ? `in ${userLocation.city}` : 'Nearby'}
          </ThemedText>
        </View>
        
        {loadingSuggestions ? (
          <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          >
            {suggestedJobs.map(job => (
              <TouchableOpacity 
                key={job.id} 
                style={styles.suggestionCard}
                onPress={() => router.push(`/job/${job.id}`)}
              >
                <ThemedText style={styles.suggestionCompany} numberOfLines={1}>{job.company}</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.suggestionTitleText} numberOfLines={1}>{job.title}</ThemedText>
                <ThemedText style={styles.suggestionLocation} numberOfLines={1}>{job.location}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const JobTypeFilter = ({ type }: { type: JobType }) => (
    <TouchableOpacity 
      style={[styles.filterOption, filters.type === type && styles.filterOptionActive]}
      onPress={() => setFilters(prev => ({ ...prev, type: prev.type === type ? undefined : type }))}
    >
      <ThemedText style={[styles.filterOptionText, filters.type === type && styles.filterOptionTextActive]}>
        {type}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <ThemedText type="title">Search Jobs</ThemedText>
            <ThemedText style={styles.subtitle}>Find your next career opportunity</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => setIsFilterModalVisible(true)}
            >
              <IconSymbol name="slider.horizontal.3" size={24} color="#007AFF" />
            </TouchableOpacity>
            {isEmployer && (
               <TouchableOpacity style={styles.createButton} onPress={navigateToCreateJob}>
                 <IconSymbol name="plus" size={24} color="#fff" />
               </TouchableOpacity>
             )}
          </View>
        </View>
      </ThemedView>
      
      <View style={styles.searchContainer}>
        <SearchBar 
          placeholder="Search title or company..."
          onSearch={setSearchQuery} 
        />
        {(searchQuery.length > 0 || filters.location || filters.tags.length > 0) && !isEmployer && (
          <TouchableOpacity 
            style={styles.saveSearchButton}
            onPress={handleSaveSearch}
          >
            <IconSymbol name="bell.badge" size={16} color="#007AFF" />
            <ThemedText style={styles.saveSearchText}>Save Search</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
              <Skeleton width="80%" height={24} style={{ marginBottom: 12 }} />
              <Skeleton width="60%" height={16} />
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ThemedText>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadJobs(true)}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
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
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Filters</ThemedText>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.filterSection}>
                <ThemedText style={styles.filterLabel}>Location</ThemedText>
                <TextInput
                  style={styles.locationInput}
                  placeholder="e.g. San Francisco, Remote"
                  value={filters.location}
                  onChangeText={(val) => setFilters(prev => ({ ...prev, location: val }))}
                />
              </View>

              <View style={styles.filterSection}>
                <ThemedText style={styles.filterLabel}>Job Type</ThemedText>
                <View style={styles.filterOptionsGrid}>
                  {(['Full-time', 'Part-time', 'Contract', 'Internship'] as JobType[]).map(type => (
                    <JobTypeFilter key={type} type={type} />
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.switchRow}>
                  <ThemedText style={styles.filterLabel}>Remote Only</ThemedText>
                  <Switch
                    value={filters.remote}
                    onValueChange={(val) => setFilters(prev => ({ ...prev, remote: val }))}
                    trackColor={{ false: '#767577', true: '#007AFF' }}
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <ThemedText style={styles.filterLabel}>Skills / Tags</ThemedText>
                <View style={styles.filterOptionsGrid}>
                  {COMMON_TAGS.map(tag => {
                    const isSelected = filters.tags.includes(tag);
                    return (
                      <TouchableOpacity 
                        key={tag}
                        style={[styles.filterOption, isSelected && styles.filterOptionActive]}
                        onPress={() => {
                          setFilters(prev => {
                            const newTags = isSelected 
                              ? prev.tags.filter(t => t !== tag)
                              : [...prev.tags, tag];
                            return { ...prev, tags: newTags };
                          });
                        }}
                      >
                        <ThemedText style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                          {tag}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setIsFilterModalVisible(false)}
            >
              <ThemedText style={styles.applyButtonText}>Apply Filters</ThemedText>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    padding: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  saveSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
    paddingVertical: 8,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0E7FF',
    marginTop: -5,
    marginBottom: 10,
    gap: 6,
  },
  saveSearchText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  suggestionsContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionsTitle: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  suggestionsList: {
    paddingRight: 16,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionCompany: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  suggestionTitleText: {
    fontSize: 14,
    color: '#000', 
    marginBottom: 8,
  },
  suggestionLocation: {
    fontSize: 12,
    color: '#007AFF',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalBody: {
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
