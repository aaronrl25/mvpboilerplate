import { Stack, useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Image, 
  ScrollView, 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Platform,
  Linking,
  Alert,
  Modal,
  TextInput
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Job, jobService } from '@/services/jobService';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';
import { applicationService } from '@/services/applicationService';
import { userService, UserProfile } from '@/services/userService';
import { aiService, JobFitAdvice } from '@/services/aiService';
import { Timestamp } from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [applyNote, setApplyNote] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<JobFitAdvice | null>(null);
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchJobDetails();
    if (user) {
      loadUserProfile();
    }
    if (id) {
      jobService.incrementViewsCount(id);
    }
  }, [id, user?.uid]);

  const fetchRelatedJobs = async (jobData: Job) => {
    if (!id || !jobData.tags) return;
    try {
      const related = await jobService.getRelatedJobs(id, jobData.tags);
      setRelatedJobs(related);
    } catch (error) {
      console.error('Error fetching related jobs:', error);
    }
  };

  const getCareerAdvice = async () => {
    if (!userProfile?.resumeText && !userProfile?.resumeUrl) {
      Alert.alert('Resume Required', 'Please upload or paste your resume text in your profile first.');
      return;
    }

    if (!job?.description) return;

    try {
      setIsAiLoading(true);
      const advice = await aiService.getJobFitAdvice(
        userProfile.resumeText || "User has uploaded a resume file but text is not extracted yet.", 
        job.description
      );
      setAiAdvice(advice);
      setIsAiModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to get career advice. Please try again later.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const data = await userService.getUserProfile(user.uid);
      setUserProfile(data as UserProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
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
      
      setUserProfile(prev => prev ? { 
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

  const fetchJobDetails = async () => {
    try {
      if (!id) return;
      setLoading(true);
      const data = await jobService.getJobById(id);
      if (data) {
        setJob(data);
        fetchRelatedJobs(data);
        if (user) {
          const saved = await jobService.isJobSaved(user.uid, id);
          setIsSaved(saved);
        }
      } else {
        setError('Job not found');
      }
    } catch (err) {
      setError('Failed to load job details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async () => {
    if (!user || !id) {
      Alert.alert('Login Required', 'Please login to save jobs');
      return;
    }

    try {
      if (isSaved) {
        await jobService.unsaveJob(user.uid, id);
        setIsSaved(false);
      } else {
        await jobService.saveJob(user.uid, id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleApply = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to apply for this job');
      return;
    }

    if (job?.applyUrl) {
      Linking.openURL(job.applyUrl).catch((err) => {
        Alert.alert('Error', 'Could not open application link');
        console.error(err);
      });
    } else {
      setIsApplyModalVisible(true);
    }
  };

  const submitApplication = async () => {
    if (!user || !id || !job || !userProfile) return;
    
    if (!userProfile.resumeUrl) {
      Alert.alert('Resume Required', 'Please upload your resume to apply.');
      return;
    }

    try {
      setIsApplying(true);
      
      await applicationService.submitApplication({
        jobId: id,
        jobTitle: job.title,
        company: job.company,
        seekerId: user.uid,
        seekerName: userProfile.displayName || user.email?.split('@')[0] || 'Applicant',
        seekerEmail: user.email || '',
        resumeUrl: userProfile.resumeUrl,
        resumeName: userProfile.resumeName || 'Resume.pdf',
        note: applyNote
      });
      
      Alert.alert('Success', 'Your application has been submitted!');
      setIsApplyModalVisible(false);
      setApplyNote('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const formatSalary = () => {
    if (job?.salaryMin && job?.salaryMax) {
      return `$${job.salaryMin / 1000}k - $${job.salaryMax / 1000}k`;
    }
    return 'Salary not specified';
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  if (error || !job) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>{error || 'Job not found'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ 
        title: job.company, 
        headerTransparent: false,
        headerRight: () => (
          <TouchableOpacity onPress={toggleSave} style={{ marginRight: 10 }}>
            <IconSymbol 
              name={isSaved ? "bookmark.fill" : "bookmark"} 
              size={24} 
              color={isSaved ? "#007AFF" : "#666"} 
            />
          </TouchableOpacity>
        )
      }} />
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <Image 
            source={{ uri: job.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${job.company}` }} 
            style={styles.logo} 
          />
          <ThemedText type="title" style={styles.title}>{job.title}</ThemedText>
          <ThemedText style={styles.company}>{job.company}</ThemedText>
          
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <IconSymbol name="mappin.and.ellipse" size={14} color="#666" />
              <ThemedText style={styles.badgeText}>{job.location}{job.remote ? ' (Remote)' : ''}</ThemedText>
            </View>
            <View style={styles.badge}>
              <IconSymbol name="briefcase.fill" size={14} color="#666" />
              <ThemedText style={styles.badgeText}>{job.type}</ThemedText>
            </View>
            <View style={styles.badge}>
              <IconSymbol name="dollarsign.circle" size={14} color="#666" />
              <ThemedText style={styles.badgeText}>{formatSalary()}</ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView style={styles.content}>
          {job.tags && job.tags.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Skills</ThemedText>
              <View style={styles.tagsContainer}>
                {job.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <ThemedText style={styles.tagText}>{tag}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Description</ThemedText>
            <ThemedText style={styles.description}>{job.description}</ThemedText>
          </ThemedView>

          {relatedJobs.length > 0 && (
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Related Jobs</ThemedText>
              <View style={styles.relatedJobsContainer}>
                {relatedJobs.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.relatedJobCard}
                    onPress={() => router.push(`/job/${item.id}`)}
                  >
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.title}</ThemedText>
                    <ThemedText style={styles.relatedJobCompany} numberOfLines={1}>{item.company}</ThemedText>
                    <ThemedText style={styles.relatedJobLocation} numberOfLines={1}>{item.location}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
      
      <ThemedView style={styles.footer}>
        <TouchableOpacity 
          style={[styles.aiButton, isAiLoading && styles.disabledButton]} 
          onPress={getCareerAdvice}
          disabled={isAiLoading}
        >
          {isAiLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <IconSymbol name="sparkles" size={20} color="#007AFF" />
              <ThemedText style={styles.aiButtonText}>AI Advice</ThemedText>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <ThemedText style={styles.applyButtonText}>Apply Now</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <Modal
        visible={isAiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.aiHeaderTitle}>
                <IconSymbol name="sparkles" size={24} color="#007AFF" />
                <ThemedText type="subtitle" style={{ marginLeft: 8 }}>Career Coach Advice</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setIsAiModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.scoreContainer}>
                <ThemedText style={styles.scoreLabel}>Job Fit Score</ThemedText>
                <ThemedText style={styles.scoreValue}>{aiAdvice?.fitScore}%</ThemedText>
              </View>

              <View style={styles.aiAdviceSection}>
                <ThemedText type="defaultSemiBold" style={styles.aiSectionTitle}>Missing Skills</ThemedText>
                {aiAdvice?.missingSkills.map((skill, i) => (
                  <View key={i} style={styles.adviceItem}>
                    <IconSymbol name="exclamationmark.circle" size={16} color="#FF9500" />
                    <ThemedText style={styles.adviceText}>{skill}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.aiAdviceSection}>
                <ThemedText type="defaultSemiBold" style={styles.aiSectionTitle}>Resume Improvements</ThemedText>
                {aiAdvice?.resumeImprovements.map((tip, i) => (
                  <View key={i} style={styles.adviceItem}>
                    <IconSymbol name="pencil" size={16} color="#007AFF" />
                    <ThemedText style={styles.adviceText}>{tip}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.aiAdviceSection}>
                <ThemedText type="defaultSemiBold" style={styles.aiSectionTitle}>Interview Tips</ThemedText>
                {aiAdvice?.interviewTips.map((tip, i) => (
                  <View key={i} style={styles.adviceItem}>
                    <IconSymbol name="checkmark.circle" size={16} color="#34C759" />
                    <ThemedText style={styles.adviceText}>{tip}</ThemedText>
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeAiButton} 
              onPress={() => setIsAiModalVisible(false)}
            >
              <ThemedText style={styles.closeAiButtonText}>Got it!</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        visible={isApplyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsApplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Apply for {job.title}</ThemedText>
              <TouchableOpacity onPress={() => setIsApplyModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.resumeSection}>
              <ThemedText style={styles.modalLabel}>Your Resume</ThemedText>
              {uploadingResume ? (
                <ActivityIndicator color="#007AFF" />
              ) : userProfile?.resumeUrl ? (
                <View style={styles.resumeAttachedCard}>
                  <IconSymbol name="doc.fill" size={20} color="#007AFF" />
                  <ThemedText style={styles.resumeAttachedName} numberOfLines={1}>
                    {userProfile.resumeName}
                  </ThemedText>
                  <TouchableOpacity onPress={handleUploadResume}>
                    <ThemedText style={styles.changeText}>Change</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadBox} onPress={handleUploadResume}>
                  <IconSymbol name="arrow.up.doc" size={24} color="#666" />
                  <ThemedText style={styles.uploadText}>Upload Resume (PDF/Doc)</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            <ThemedText style={styles.modalLabel}>Add a note to your application (optional)</ThemedText>
            <TextInput
              style={styles.noteInput}
              placeholder="Tell the employer why you're a good fit..."
              multiline
              numberOfLines={4}
              value={applyNote}
              onChangeText={setApplyNote}
            />
            
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                (isApplying || !userProfile?.resumeUrl) && styles.disabledButton
              ]}
              onPress={submitApplication}
              disabled={isApplying || !userProfile?.resumeUrl}
            >
              {isApplying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Submit Application</ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  company: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 8,
    paddingLeft: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    gap: 12,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  aiButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  relatedJobsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  relatedJobCard: {
    width: 160,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  relatedJobCompany: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  relatedJobLocation: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  aiHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  aiAdviceSection: {
    marginBottom: 20,
  },
  aiSectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    paddingRight: 10,
  },
  adviceText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    flex: 1,
  },
  closeAiButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeAiButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resumeSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  resumeAttachedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  resumeAttachedName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  changeText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadText: {
    color: '#666',
    fontSize: 14,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
