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
import { applicationService, JobApplication } from '@/services/applicationService';
import { Job, jobService } from '@/services/jobService';
import { subscriptionService, SUBSCRIPTION_PLANS } from '@/services/subscriptionService';
import { locationService, LocationData } from '@/services/locationService';

export default function ProfileScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingSavedSearches, setLoadingSavedSearches] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
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
      fetchApplications();
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

  const fetchApplications = async () => {
    if (!user) return;
    try {
      setLoadingApps(true);
      const data = await applicationService.getSeekerApplications(user.uid);
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApps(false);
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
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
        <TouchableOpacity onPress={() => setEditModalVisible(true)}>
          <ThemedText style={styles.editButtonText}>Edit</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <Image 
            source={{ uri: profileData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}` }} 
            style={styles.avatar} 
          />
          <ThemedText type="subtitle" style={styles.userName}>
            {profileData?.displayName || user?.email?.split('@')[0]}
          </ThemedText>
          <ThemedText style={styles.userTitle}>
            {profileData?.title || 'No title set'}
          </ThemedText>
          <View style={styles.roleBadge}>
            <ThemedText style={styles.roleText}>
              {profileData?.role?.toUpperCase() || 'JOB SEEKER'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>About</ThemedText>
          <ThemedText style={styles.bioText}>
            {profileData?.bio || 'No bio provided yet.'}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Location Preference</ThemedText>
            <TouchableOpacity onPress={updateLocation} disabled={updatingLocation}>
              {updatingLocation ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <ThemedText style={styles.editButtonText}>Update</ThemedText>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.locationCard}>
            <IconSymbol name="mappin.and.ellipse" size={20} color="#007AFF" />
            <View style={styles.locationInfo}>
              <ThemedText style={styles.locationCity}>
                {profileData?.locationData?.city || 'No location set'}
              </ThemedText>
              <ThemedText style={styles.locationAddress}>
                {profileData?.locationData?.address || 'Update to get nearby suggestions'}
              </ThemedText>
            </View>
          </View>
        </View>

        {isEmployer && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Employer Dashboard</ThemedText>
              <TouchableOpacity onPress={() => router.push('/employer/stats')}>
                <ThemedText style={styles.editButtonText}>View Stats</ThemedText>
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
                <IconSymbol name="chart.bar.fill" size={24} color="#007AFF" />
                <ThemedText style={styles.statsPreviewLabel}>Full Stats</ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {isEmployer && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Subscription Plan</ThemedText>
              <TouchableOpacity onPress={() => router.push('/employer/subscription')}>
                <ThemedText style={styles.editButtonText}>Manage</ThemedText>
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
           <View style={styles.section}>
             <View style={styles.sectionHeader}>
               <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>My Job Postings</ThemedText>
               <TouchableOpacity onPress={() => router.push('/job/create')}>
                 <ThemedText style={styles.editButtonText}>Create New</ThemedText>
               </TouchableOpacity>
             </View>
             {loadingJobs ? (
               <ActivityIndicator color="#007AFF" />
             ) : employerJobs.length > 0 ? (
               employerJobs.map((job) => (
                 <TouchableOpacity 
                   key={job.id} 
                   style={styles.appCard}
                   onPress={() => router.push(`/employer/applications/${job.id}`)}
                 >
                   <View style={styles.appInfo}>
                     <ThemedText style={styles.appTitle}>{job.title}</ThemedText>
                     <ThemedText style={styles.appCompany}>{job.location}{job.remote ? ' (Remote)' : ''}</ThemedText>
                     <ThemedText style={styles.appDate}>Posted: {formatDate(job.postedAt)}</ThemedText>
                   </View>
                   <IconSymbol name="chevron.right" size={20} color="#999" />
                 </TouchableOpacity>
               ))
             ) : (
               <ThemedText style={styles.emptyText}>You haven't posted any jobs yet.</ThemedText>
             )}
           </View>
         ) : (
           <>
             <View style={styles.section}>
               <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Saved Job Alerts</ThemedText>
               {loadingSavedSearches ? (
                 <ActivityIndicator color="#007AFF" />
               ) : savedSearches.length > 0 ? (
                 savedSearches.map((search) => (
                   <View key={search.id} style={styles.searchAlertCard}>
                     <View style={styles.searchAlertInfo}>
                       <ThemedText style={styles.searchAlertTitle}>
                         {search.query || 'All Jobs'}
                       </ThemedText>
                       <ThemedText style={styles.searchAlertMeta}>
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
                 <ThemedText style={styles.emptyText}>No saved searches yet.</ThemedText>
               )}
             </View>

             <View style={styles.section}>
               <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>My Applications</ThemedText>
               {loadingApps ? (
                 <ActivityIndicator color="#007AFF" />
               ) : applications.length > 0 ? (
                 applications.map((app) => (
                   <View key={app.id} style={styles.appCard}>
                     <View style={styles.appInfo}>
                       <ThemedText style={styles.appTitle}>{app.jobTitle}</ThemedText>
                       <ThemedText style={styles.appCompany}>{app.company}</ThemedText>
                       <ThemedText style={styles.appDate}>{formatDate(app.createdAt)}</ThemedText>
                     </View>
                     <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) }]}>
                       <ThemedText style={styles.statusText}>{app.status}</ThemedText>
                     </View>
                   </View>
                 ))
               ) : (
                 <ThemedText style={styles.emptyText}>You haven't applied to any jobs yet.</ThemedText>
               )}
             </View>

             <View style={styles.section}>
               <View style={styles.sectionHeader}>
                 <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Resume</ThemedText>
                 <TouchableOpacity onPress={handleUploadResume} disabled={uploadingResume}>
                   <ThemedText style={styles.editButtonText}>
                     {profileData?.resumeUrl ? 'Replace' : 'Upload'}
                   </ThemedText>
                 </TouchableOpacity>
               </View>
               
               {uploadingResume ? (
                 <ActivityIndicator style={{ marginVertical: 10 }} color="#007AFF" />
               ) : profileData?.resumeUrl ? (
                 <View style={styles.resumeCard}>
                   <View style={styles.resumeInfo}>
                     <IconSymbol name="doc.fill" size={24} color="#007AFF" />
                     <View style={styles.resumeTextContainer}>
                       <ThemedText style={styles.resumeName} numberOfLines={1}>
                         {profileData.resumeName || 'My Resume'}
                       </ThemedText>
                       <ThemedText style={styles.resumeDate}>
                         Uploaded: {formatDate(profileData.resumeUpdatedAt)}
                       </ThemedText>
                     </View>
                   </View>
                   <TouchableOpacity onPress={handleDeleteResume}>
                     <IconSymbol name="trash" size={20} color="#FF3B30" />
                   </TouchableOpacity>
                 </View>
               ) : (
                 <ThemedText style={styles.emptyText}>No resume uploaded yet</ThemedText>
               )}
             </View>
           </>
         )}

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Account Information</ThemedText>
          <View style={styles.infoRow}>
            <IconSymbol name="envelope.fill" size={20} color="#666" />
            <View style={styles.infoText}>
              <ThemedText type="defaultSemiBold">Email</ThemedText>
              <ThemedText>{user?.email}</ThemedText>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Edit Profile</ThemedText>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <ThemedText style={styles.inputLabel}>Display Name</ThemedText>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full Name"
              />

              <ThemedText style={styles.inputLabel}>Professional Title</ThemedText>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="e.g. Senior Software Engineer"
              />

              <ThemedText style={styles.inputLabel}>Bio</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity 
                style={styles.saveButton} 
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  userTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  userEmail: {
    opacity: 0.6,
  },
  roleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 25,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 15,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  statsPreviewCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statsPreviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsPreviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statsPreviewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsPreviewDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#eee',
  },
  searchAlertCard: {
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
  searchAlertInfo: {
    flex: 1,
    marginRight: 10,
  },
  searchAlertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  searchAlertMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resumeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resumeTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  resumeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resumeDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 10,
  },
  infoText: {
    flex: 1,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  appInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  appCompany: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 2,
  },
  appDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  logoutButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#FFF1F0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFA39E',
    marginBottom: 40,
  },
  logoutText: {
    color: '#F5222D',
    fontWeight: '600',
  },
  planInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  planInfoMain: {
    flex: 1,
  },
  planNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  planLimitText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0E7FF',
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationCity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  locationAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalForm: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
