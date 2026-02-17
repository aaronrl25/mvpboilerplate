import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput, 
  Modal, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { logout, updateAuthProfile } from '@/store/authSlice';
import { userService, UserProfile } from '@/services/userService';
import * as DocumentPicker from 'expo-document-picker';
import { Job, jobService } from '@/services/jobService';
import { subscriptionService, SUBSCRIPTION_PLANS } from '@/services/subscriptionService';
import { locationService, LocationData } from '@/services/locationService';

import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingSavedSearches, setLoadingSavedSearches] = useState(false);
  const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  
  const isEmployer = profileData?.role === 'employer';
  
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !profileData?.role) return;
    
    if (profileData.role === 'employer') {
      fetchEmployerJobs();
    } else {
      fetchSavedSearches();
    }
  }, [user?.uid, profileData?.role]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await userService.getUserProfile(user.uid);
      if (data) {
        setProfileData(data);
        setEditName(data.displayName || '');
        setEditTitle(data.title || '');
        setEditBio(data.bio || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedSearches = async () => {
    if (!user) return;
    try {
      setLoadingSavedSearches(true);
      const data = await jobService.getSavedSearches(user.uid);
      setSavedSearches(data);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    } finally {
      setLoadingSavedSearches(false);
    }
  };

  const handleDeleteSavedSearch = async (searchId: string) => {
    if (!user) return;
    try {
      await jobService.deleteSavedSearch(user.uid, searchId);
      setSavedSearches(prev => prev.filter(s => s.id !== searchId));
    } catch (error) {
      console.error('Error deleting saved search:', error);
      Alert.alert('Error', 'Failed to delete saved search');
    }
  };

  const fetchEmployerJobs = async () => {
    if (!user) return;
    try {
      setLoadingJobs(true);
      const data = await jobService.getJobsByEmployer(user.uid);
      setEmployerJobs(data);
    } catch (error) {
      console.error('Error fetching employer jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const updateLocation = async () => {
    if (!user?.uid) return;
    try {
      setUpdatingLocation(true);
      const location = await locationService.getCurrentLocation();
      if (location) {
        await userService.updateProfile(user.uid, {
          locationData: {
            ...location,
            lastUpdated: Timestamp.now()
          }
        });
        // Refresh profile data
        await fetchProfile();
        Alert.alert('Success', `Location updated to ${location.city || 'your current area'}`);
      } else {
        Alert.alert('Error', 'Could not get your location. Please check your permissions.');
      }
    } catch (error) {
      console.error('Update location error:', error);
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await userService.updateProfile(user.uid, {
        displayName: editName,
        title: editTitle,
        bio: editBio,
      });
      
      // Update local state
      setProfileData((prev: any) => prev ? {
        ...prev,
        displayName: editName,
        title: editTitle,
        bio: editBio,
      } : null);
      
      // Update Redux state if needed
      dispatch(updateAuthProfile({ displayName: editName }));
      
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadResume = async () => {
    if (!user) return;
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploadingResume(true);
      
      const { url, name } = await applicationService.uploadResume(file.uri, user.uid, file.name);
      
      setProfileData((prev: UserProfile | null) => prev ? { 
        ...prev, 
        resumeUrl: url, 
        resumeName: name,
        resumeUpdatedAt: Timestamp.now() 
      } : null);
      
      Alert.alert('Success', 'Resume uploaded successfully');
    } catch (error) {
      console.error('Resume upload error:', error);
      Alert.alert('Error', 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!user || !profileData?.resumeUrl) return;

    Alert.alert(
      'Delete Resume',
      'Are you sure you want to delete your current resume?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingResume(true);
              await applicationService.deleteResume(user.uid, profileData.resumeUrl!);
              setProfileData((prev: UserProfile | null) => prev ? { 
                ...prev, 
                resumeUrl: undefined, 
                resumeName: undefined, 
                resumeUpdatedAt: undefined 
              } : null);
              Alert.alert('Success', 'Resume deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete resume');
            } finally {
              setUploadingResume(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (date?: any) => {
     if (!date) return '';
     const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
     return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === (profileData?.subscriptionPlan || 'free'));

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={{ color: theme.text }}>Profile</ThemedText>
        <TouchableOpacity 
          style={[styles.headerEditButton, { backgroundColor: theme.surface, ...Shadows.sm }]}
          onPress={() => setEditModalVisible(true)}
        >
          <IconSymbol name="pencil" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.avatarSection, { backgroundColor: theme.surface, ...Shadows.sm }]}>
          <Image 
            source={{ uri: profileData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}` }} 
            style={[styles.avatar, { borderColor: theme.background }]} 
          />
          <View style={styles.avatarInfo}>
            <ThemedText style={[styles.userName, { color: theme.text }]}>
              {profileData?.displayName || user?.email?.split('@')[0]}
            </ThemedText>
            <ThemedText style={[styles.userTitle, { color: theme.textSecondary }]}>
              {profileData?.title || 'No title set'}
            </ThemedText>
            <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15' }]}>
              <ThemedText style={[styles.roleText, { color: theme.primary }]}>
                {profileData?.role?.toUpperCase() || 'JOB SEEKER'}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, ...Shadows.sm }]}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text, marginBottom: Spacing.md }]}>About</ThemedText>
          <ThemedText style={[styles.bioText, { color: theme.textSecondary }]}>
            {profileData?.bio || 'No bio provided yet.'}
          </ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, ...Shadows.sm }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Location Preference</ThemedText>
            <TouchableOpacity onPress={updateLocation} disabled={updatingLocation}>
              {updatingLocation ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>Update</ThemedText>
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.locationCard, { backgroundColor: theme.background }]}>
            <View style={[styles.locationIconContainer, { backgroundColor: theme.primary + '15' }]}>
              <IconSymbol name="mappin.and.ellipse" size={20} color={theme.primary} />
            </View>
            <View style={styles.locationInfo}>
              <ThemedText style={[styles.locationCity, { color: theme.text }]}>
                {profileData?.locationData?.city || 'No location set'}
              </ThemedText>
              <ThemedText style={[styles.locationAddress, { color: theme.textTertiary }]}>
                {profileData?.locationData?.address || 'Update to get nearby suggestions'}
              </ThemedText>
            </View>
          </View>
        </View>

        {isEmployer && (
          <View style={[styles.section, { backgroundColor: theme.surface, ...Shadows.sm }]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Employer Dashboard</ThemedText>
              <TouchableOpacity onPress={() => router.push('/employer/stats')}>
                <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>View Stats</ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.statsPreviewCard}
              onPress={() => router.push('/employer/stats')}
            >
              <View style={styles.statsPreviewItem}>
                <ThemedText style={styles.statsPreviewValue}>{employerJobs.length}</ThemedText>
                <ThemedText style={styles.statsPreviewLabel}>Jobs</ThemedText>
              </View>
              <View style={styles.statsPreviewDivider} />
              <View style={styles.statsPreviewItem}>
                <ThemedText style={styles.statsPreviewValue}>
                  {employerJobs.reduce((acc, job) => acc + (job.viewsCount || 0), 0)}
                </ThemedText>
                <ThemedText style={styles.statsPreviewLabel}>Views</ThemedText>
              </View>
              <View style={styles.statsPreviewDivider} />
              <View style={styles.statsPreviewItem}>
                <IconSymbol name="chart.bar.fill" size={20} color={theme.primary} />
                <ThemedText style={styles.statsPreviewLabel}>Analytics</ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {isEmployer && (
          <View style={[styles.section, { backgroundColor: theme.surface, ...Shadows.sm }]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Subscription Plan</ThemedText>
              <TouchableOpacity onPress={() => router.push('/employer/subscription')}>
                <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>Manage</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.planInfoCard}>
              <View style={styles.planInfoMain}>
                <ThemedText style={styles.planNameText}>{currentPlan?.name} Plan</ThemedText>
                <ThemedText style={styles.planLimitText}>
                  {employerJobs.length} / {currentPlan?.jobLimit === 9999 ? '∞' : currentPlan?.jobLimit} Jobs Posted
                </ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#34C759' }]}>
                <ThemedText style={styles.statusText}>Active</ThemedText>
              </View>
            </View>
          </View>
        )}

        {isEmployer ? (
           <View style={[styles.section, { backgroundColor: theme.surface, ...Shadows.sm }]}>
             <View style={styles.sectionHeader}>
               <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>My Job Postings</ThemedText>
               <TouchableOpacity onPress={() => router.push('/job/create')}>
                 <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>Create New</ThemedText>
               </TouchableOpacity>
             </View>
             {loadingJobs ? (
               <ActivityIndicator color={theme.primary} />
             ) : employerJobs.length > 0 ? (
               employerJobs.map((job) => (
                 <TouchableOpacity 
                   key={job.id} 
                   style={[styles.appCard, { backgroundColor: theme.background }]}
                   onPress={() => router.push(`/employer/applications/${job.id}`)}
                 >
                   <View style={styles.appInfo}>
                     <ThemedText style={[styles.appTitle, { color: theme.text }]}>{job.title}</ThemedText>
                     <ThemedText style={[styles.appCompany, { color: theme.textSecondary }]}>{job.location}{job.remote ? ' (Remote)' : ''}</ThemedText>
                     <ThemedText style={[styles.appDate, { color: theme.textTertiary }]}>Posted: {formatDate(job.postedAt)}</ThemedText>
                   </View>
                   <IconSymbol name="chevron.right" size={20} color={theme.textTertiary} />
                 </TouchableOpacity>
               ))
             ) : (
               <ThemedText style={[styles.emptyText, { color: theme.textTertiary }]}>You haven't posted any jobs yet.</ThemedText>
             )}
           </View>
         ) : (
           <>
             <View style={[styles.section, { backgroundColor: theme.surface, ...Shadows.sm }]}>
               <ThemedText style={[styles.sectionTitle, { color: theme.text, marginBottom: Spacing.md }]}>Saved Job Alerts</ThemedText>
               {loadingSavedSearches ? (
                 <ActivityIndicator color={theme.primary} />
               ) : savedSearches.length > 0 ? (
                 savedSearches.map((search) => (
                   <View key={search.id} style={[styles.searchAlertCard, { backgroundColor: theme.background }]}>
                     <View style={styles.searchAlertInfo}>
                       <ThemedText style={[styles.searchAlertTitle, { color: theme.text }]}>
                         {search.query || 'All Jobs'}
                       </ThemedText>
                       <ThemedText style={[styles.searchAlertMeta, { color: theme.textSecondary }]}>
                         {[
                           search.filters?.location,
                           search.filters?.type,
                           ...(search.filters?.tags || [])
                         ].filter(Boolean).join(' • ') || 'No filters'}
                       </ThemedText>
                     </View>
                     <TouchableOpacity onPress={() => handleDeleteSavedSearch(search.id)}>
                       <IconSymbol name="bell.slash" size={20} color="#FF3B30" />
                     </TouchableOpacity>
                   </View>
                 ))
               ) : (
                 <ThemedText style={[styles.emptyText, { color: theme.textTertiary }]}>No saved searches yet.</ThemedText>
               )}
             </View>

             {profileData.role === 'job_seeker' && (
               <View style={[styles.section, { backgroundColor: theme.surface, ...Shadows.sm }]}>
                 <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/jobseeker/myapplications')}>
                   <IconSymbol name="doc.text.fill" size={24} color={theme.text} style={{ marginRight: Spacing.sm }} />
                   <ThemedText style={{ fontSize: 16, fontWeight: '600', flex: 1 }}>My Applications</ThemedText>
                   <IconSymbol name="chevron.right" size={20} color={theme.text} />
                 </TouchableOpacity>
               </View>
             )}

             <View style={[styles.section, { backgroundColor: theme.surface, ...Shadows.sm }]}>
               <View style={styles.sectionHeader}>
                 <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>My Resume</ThemedText>
                 <TouchableOpacity onPress={handleUploadResume} disabled={uploadingResume}>
                   <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
                     {profileData?.resumeUrl ? 'Replace' : 'Upload'}
                   </ThemedText>
                 </TouchableOpacity>
               </View>
               
               {uploadingResume ? (
                 <ActivityIndicator style={{ marginVertical: Spacing.md }} color={theme.primary} />
               ) : profileData?.resumeUrl ? (
                 <View style={[styles.resumeCard, { backgroundColor: theme.background }]}>
                   <View style={[styles.resumeIconContainer, { backgroundColor: '#FF3B3015' }]}>
                     <IconSymbol name="doc.fill" size={24} color="#FF3B30" />
                   </View>
                   <View style={styles.resumeInfo}>
                     <View style={styles.resumeTextContainer}>
                       <ThemedText style={[styles.resumeName, { color: theme.text }]} numberOfLines={1}>
                         {profileData.resumeName || 'Resume.pdf'}
                       </ThemedText>
                       <ThemedText style={[styles.resumeDate, { color: theme.textTertiary }]}>
                         Updated {formatDate(profileData.resumeUpdatedAt)}
                       </ThemedText>
                     </View>
                   </View>
                   <TouchableOpacity onPress={handleDeleteResume}>
                     <IconSymbol name="trash" size={20} color="#FF3B30" />
                   </TouchableOpacity>
                 </View>
               ) : (
                 <TouchableOpacity 
                   style={[styles.resumeCard, { backgroundColor: theme.background, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border, justifyContent: 'center' }]}
                   onPress={handleUploadResume}
                 >
                   <IconSymbol name="plus.circle" size={24} color={theme.textTertiary} />
                   <ThemedText style={[styles.emptyText, { color: theme.textTertiary, marginLeft: 8 }]}>Upload your resume</ThemedText>
                 </TouchableOpacity>
               )}
             </View>
           </>
         )}

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: theme.surface, borderColor: '#FF3B30', borderWidth: 1 }]} 
          onPress={handleLogout}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#FF3B30" />
          <ThemedText style={[styles.logoutText, { color: '#FF3B30' }]}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Edit Profile</ThemedText>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
              <View>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name</ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your Name"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>

              <View>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Professional Title</ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="e.g. Senior Product Designer"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>

              <View>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Bio</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1, ...Shadows.md }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
  },
  avatarInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700', 
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 15,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18, 
    fontWeight: '700',
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  locationCity: {
    fontSize: 15,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 13,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  experienceItem: {
    paddingVertical: Spacing.md,
  },
  expRole: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  expCompany: {
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  infoText: {
    marginLeft: Spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  resumeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resumeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  resumeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  resumeDate: {
    fontSize: 12,
  },
  statsPreviewCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statsPreviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsPreviewValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsPreviewLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statsPreviewDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(150,150,150,0.2)',
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  appInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  appCompany: {
    fontSize: 13,
    marginTop: 2,
  },
  appDate: {
    fontSize: 11,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#fff',
  },
  planInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  planInfoMain: {
    flex: 1,
  },
  planNameText: {
    fontSize: 15,
    fontWeight: '600',
  },
  planLimitText: {
    fontSize: 13,
    marginTop: 2,
  },
  searchAlertCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
  },
  searchAlertInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  searchAlertTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchAlertMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  menuIcon: {
    marginRight: Spacing.sm,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalForm: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
