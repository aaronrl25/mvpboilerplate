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

import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function JobDetailsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (error || !job) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText style={{ color: theme.text }}>{error || 'Job not found'}</ThemedText>
        <TouchableOpacity style={[styles.backButton, { marginTop: Spacing.md }]} onPress={() => router.back()}>
          <ThemedText style={{ color: theme.primary }}>Go Back</ThemedText>
        </TouchableOpacity>
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
        headerRight: () => (
          <TouchableOpacity 
            onPress={toggleSave} 
            style={[styles.headerCircleButton, { backgroundColor: theme.surface, ...Shadows.sm, marginRight: Spacing.md }]}
          >
            <IconSymbol 
              name={isSaved ? "bookmark.fill" : "bookmark"} 
              size={20} 
              color={isSaved ? theme.primary : theme.text} 
            />
          </TouchableOpacity>
        )
      }} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSpacer} />
        
        <View style={styles.jobHeader}>
          <View style={[styles.companyLogoContainer, { backgroundColor: theme.surface, ...Shadows.md, borderColor: theme.border }]}>
            <Image 
              source={{ uri: job.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${job.company}` }} 
              style={styles.logo} 
            />
          </View>
          
          <ThemedText type="title" style={[styles.jobTitle, { color: theme.text }]}>{job.title}</ThemedText>
          <ThemedText style={[styles.companyName, { color: theme.primary }]}>{job.company}</ThemedText>
          
          <View style={styles.metaRow}>
            <View style={[styles.metaBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <IconSymbol name="mappin.and.ellipse" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>{job.location}</ThemedText>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <IconSymbol name="briefcase.fill" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>{job.type}</ThemedText>
            </View>
            {job.remote && (
              <View style={[styles.metaBadge, { backgroundColor: theme.primary + '15', borderColor: 'transparent' }]}>
                <IconSymbol name="globe" size={12} color={theme.primary} style={{ marginRight: 4 }} />
                <ThemedText style={[styles.metaText, { color: theme.primary, fontWeight: '700' }]}>Remote</ThemedText>
              </View>
            )}
          </View>

          <View style={[styles.salaryCard, { backgroundColor: theme.surface, ...Shadows.md, borderColor: theme.border }]}>
            <View style={styles.salaryInfo}>
              <View style={[styles.salaryIconBox, { backgroundColor: theme.primary + '10' }]}>
                <IconSymbol name="dollarsign.circle.fill" size={18} color={theme.primary} />
              </View>
              <View>
                <ThemedText style={[styles.salaryLabel, { color: theme.textSecondary }]}>Salary Range</ThemedText>
                <ThemedText style={[styles.salaryValue, { color: theme.text }]}>{formatSalary()}</ThemedText>
              </View>
            </View>
            <View style={[styles.salaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.postedInfo}>
              <View style={[styles.salaryIconBox, { backgroundColor: theme.textSecondary + '10' }]}>
                <IconSymbol name="calendar" size={18} color={theme.textSecondary} />
              </View>
              <View>
                <ThemedText style={[styles.salaryLabel, { color: theme.textSecondary }]}>Posted</ThemedText>
                <ThemedText style={[styles.salaryValue, { color: theme.text }]}>{formatDate(job.postedAt)}</ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.primary + '15' }]}>
              <IconSymbol name="text.alignleft" size={16} color={theme.primary} />
            </View>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: theme.text }]}>Job Description</ThemedText>
          </View>
          <View style={[styles.descriptionContainer, { backgroundColor: theme.surface, borderColor: theme.border, ...Shadows.sm }]}>
            <ThemedText style={[styles.descriptionText, { color: theme.textSecondary }]}>{job.description}</ThemedText>
          </View>
        </View>

        {job.tags && job.tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIcon, { backgroundColor: theme.primary + '15' }]}>
                <IconSymbol name="tag.fill" size={16} color={theme.primary} />
              </View>
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: theme.text }]}>Skills & Tags</ThemedText>
            </View>
            <View style={styles.tagsContainer}>
              {job.tags.map((tag, index) => (
                <View key={index} style={[styles.tagBadge, { backgroundColor: theme.surface, borderColor: theme.border, ...Shadows.sm }]}>
                  <ThemedText style={[styles.tagText, { color: theme.textSecondary }]}>{tag}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {relatedJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIcon, { backgroundColor: theme.primary + '15' }]}>
                <IconSymbol name="sparkles" size={16} color={theme.primary} />
              </View>
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: theme.text }]}>Similar Roles</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedJobsScroll} contentContainerStyle={{ paddingRight: Spacing.xl }}>
              {relatedJobs.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.relatedJobCard, { backgroundColor: theme.surface, borderColor: theme.border, ...Shadows.sm }]}
                  onPress={() => router.push(`/job/${item.id}`)}
                >
                  <View style={styles.relatedJobHeader}>
                    <Image 
                      source={{ uri: item.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${item.company}` }} 
                      style={styles.relatedLogo} 
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="defaultSemiBold" numberOfLines={1} style={{ color: theme.text }}>{item.title}</ThemedText>
                      <ThemedText style={[styles.relatedJobCompany, { color: theme.primary }]} numberOfLines={1}>{item.company}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.relatedJobFooter}>
                    <IconSymbol name="mappin.and.ellipse" size={12} color={theme.textTertiary} />
                    <ThemedText style={[styles.relatedJobLocation, { color: theme.textSecondary }]} numberOfLines={1}>{item.location}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
      
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, ...Shadows.lg }]}>
        <TouchableOpacity 
          style={[styles.aiButton, { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]} 
          onPress={getCareerAdvice}
          disabled={isAiLoading}
        >
          {isAiLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <>
              <View style={[styles.aiIconBadge, { backgroundColor: theme.primary }]}>
                <IconSymbol name="sparkles" size={14} color="#fff" />
              </View>
              <ThemedText style={[styles.aiButtonText, { color: theme.primary }]}>AI Fit Score</ThemedText>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.applyButton, { backgroundColor: theme.primary, ...Shadows.md }]} 
          onPress={handleApply}
        >
          <ThemedText style={styles.applyButtonText}>Apply Now</ThemedText>
          <IconSymbol name="arrow.right" size={18} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isAiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.aiHeaderTitle}>
                <IconSymbol name="sparkles" size={24} color={theme.primary} />
                <ThemedText type="subtitle" style={{ marginLeft: 8, color: theme.text }}>AI Career Coach</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setIsAiModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.scoreCard, { backgroundColor: theme.primary + '08' }]}>
                <ThemedText style={[styles.scoreLabel, { color: theme.textSecondary }]}>Match Score</ThemedText>
                <ThemedText style={[styles.scoreValue, { color: theme.primary }]}>{aiAdvice?.fitScore}%</ThemedText>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${aiAdvice?.fitScore || 0}%`, backgroundColor: theme.primary }]} />
                </View>
              </View>

              <View style={styles.aiAdviceSection}>
                <ThemedText type="defaultSemiBold" style={[styles.aiSectionTitle, { color: theme.text }]}>Missing Skills</ThemedText>
                {aiAdvice?.missingSkills.map((skill, i) => (
                  <View key={i} style={[styles.adviceItem, { backgroundColor: theme.background }]}>
                    <IconSymbol name="exclamationmark.circle.fill" size={16} color="#FF9500" />
                    <ThemedText style={[styles.adviceText, { color: theme.textSecondary }]}>{skill}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.aiAdviceSection}>
                <ThemedText type="defaultSemiBold" style={[styles.aiSectionTitle, { color: theme.text }]}>Resume Tips</ThemedText>
                {aiAdvice?.resumeImprovements.map((tip, i) => (
                  <View key={i} style={[styles.adviceItem, { backgroundColor: theme.background }]}>
                    <IconSymbol name="lightbulb.fill" size={16} color={theme.primary} />
                    <ThemedText style={[styles.adviceText, { color: theme.textSecondary }]}>{tip}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.aiAdviceSection}>
                <ThemedText type="defaultSemiBold" style={[styles.aiSectionTitle, { color: theme.text }]}>Interview Strategy</ThemedText>
                {aiAdvice?.interviewTips.map((tip, i) => (
                  <View key={i} style={[styles.adviceItem, { backgroundColor: theme.background }]}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color="#34C759" />
                    <ThemedText style={[styles.adviceText, { color: theme.textSecondary }]}>{tip}</ThemedText>
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.closeAiButton, { backgroundColor: theme.primary, ...Shadows.md }]} 
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
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={{ color: theme.text }}>Apply Now</ThemedText>
              <TouchableOpacity onPress={() => setIsApplyModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.resumeSection}>
              <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>Your Resume</ThemedText>
              {uploadingResume ? (
                <View style={styles.loadingResume}>
                  <ActivityIndicator color={theme.primary} />
                  <ThemedText style={{ color: theme.textSecondary, marginTop: 8 }}>Uploading...</ThemedText>
                </View>
              ) : userProfile?.resumeUrl ? (
                <View style={[styles.resumeAttachedCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <IconSymbol name="doc.fill" size={24} color={theme.primary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText style={[styles.resumeAttachedName, { color: theme.text }]} numberOfLines={1}>
                      {userProfile.resumeName}
                    </ThemedText>
                    <ThemedText style={{ color: theme.textTertiary, fontSize: 12 }}>Attached Resume</ThemedText>
                  </View>
                  <TouchableOpacity onPress={handleUploadResume}>
                    <ThemedText style={[styles.changeText, { color: theme.primary }]}>Change</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.uploadBox, { backgroundColor: theme.background, borderColor: theme.border, borderStyle: 'dashed' }]} 
                  onPress={handleUploadResume}
                >
                  <IconSymbol name="arrow.up.doc.fill" size={32} color={theme.textTertiary} />
                  <ThemedText style={[styles.uploadText, { color: theme.textSecondary }]}>Upload Resume (PDF/Doc)</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>Cover Note (Optional)</ThemedText>
            <TextInput
              style={[styles.noteInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Tell the employer why you're a good fit..."
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={4}
              value={applyNote}
              onChangeText={setApplyNote}
            />
            
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                { backgroundColor: theme.primary, ...Shadows.md },
                (isApplying || !userProfile?.resumeUrl) && { opacity: 0.5 }
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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
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
  jobHeader: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  companyLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
  },
  jobTitle: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  salaryCard: {
    flexDirection: 'row',
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  salaryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  salaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  salaryDivider: {
    width: 1,
    height: 30,
    marginHorizontal: Spacing.md,
  },
  postedInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  salaryLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    fontWeight: '600',
  },
  salaryValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',    marginBottom: Spacing.md,
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  descriptionContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  relatedJobsScroll: {
    marginHorizontal: -Spacing.xl,
    paddingLeft: Spacing.xl,
  },
  relatedJobCard: {
    width: 240,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    borderWidth: 1,
    gap: 12,
  },
  relatedJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  relatedLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  relatedJobCompany: {
    fontSize: 13,
    fontWeight: '600',
  },
  relatedJobFooter: {
    flexDirection: 'row',    alignItems: 'center',
    gap: 4,
  },
  relatedJobLocation: {
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.md,    borderTopWidth: 1,
  },
  aiButton: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    gap: 8,
  },
  aiIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,    justifyContent: 'center',
    alignItems: 'center',
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  applyButton: {
    flex: 1.5,
    height: 56,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl * 2,
    borderTopRightRadius: BorderRadius.xl * 2,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  aiHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: Spacing.md,
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiAdviceSection: {
    marginBottom: Spacing.xl,
  },
  aiSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  adviceItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    gap: 12,
  },
  adviceText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  closeAiButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  closeAiButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  resumeSection: {
    marginBottom: Spacing.xl,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  loadingResume: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  resumeAttachedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  resumeAttachedName: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  uploadBox: {
    height: 120,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
  },
  noteInput: {
    height: 120,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  submitButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  backButton: {
    padding: 10,
  },
});
