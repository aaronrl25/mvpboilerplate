import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  getDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { userService } from './userService';
import { notificationService } from './notificationService';
import { jobService } from './jobService';

export interface JobApplication {
  id?: string;
  jobId: string;
  jobTitle: string;
  company: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  resumeUrl: string;
  resumeName: string;
  note?: string;
  status: 'pending' | 'reviewed' | 'rejected' | 'accepted';
  createdAt: Timestamp;
}

const APPLICATIONS_COLLECTION = 'applications';

export const applicationService = {
  // Upload resume to Firebase Storage
  uploadResume: async (uri: string, userId: string, fileName: string): Promise<{ url: string; name: string }> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExtension = fileName.split('.').pop();
      const storageFileName = `resumes/${userId}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, storageFileName);
      
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      
      // Update user profile with resume info
      await userService.updateProfile(userId, {
        resumeUrl: url,
        resumeName: fileName,
        resumeUpdatedAt: Timestamp.now()
      });
      
      return { url, name: fileName };
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw error;
    }
  },

  // Delete resume from Storage and Profile
  deleteResume: async (userId: string, resumeUrl: string): Promise<void> => {
    try {
      // 1. Delete from Storage
      const storageRef = ref(storage, resumeUrl);
      await deleteObject(storageRef).catch(err => console.log('File already deleted from storage or path invalid'));
      
      // 2. Remove from Profile
      await userService.updateProfile(userId, {
        resumeUrl: undefined,
        resumeName: undefined,
        resumeUpdatedAt: undefined
      } as any);
    } catch (error) {
      console.error('Error deleting resume:', error);
      throw error;
    }
  },

  // Submit application
  submitApplication: async (application: Omit<JobApplication, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, APPLICATIONS_COLLECTION), {
        ...application,
        status: 'pending',
        createdAt: Timestamp.now(),
      });

      // Notify Employer
      try {
        const job = await jobService.getJobById(application.jobId);
        if (job && job.employerId) {
          await notificationService.sendNotification({
            userId: job.employerId,
            title: 'New Application',
            message: `${application.seekerName} applied for ${application.jobTitle}`,
            type: 'application_received',
            relatedId: docRef.id
          });
        }
      } catch (notifyError) {
        console.error('Failed to notify employer:', notifyError);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  },

  // Get applications for a seeker
  getSeekerApplications: async (seekerId: string): Promise<JobApplication[]> => {
    try {
      const q = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('seekerId', '==', seekerId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobApplication));
    } catch (error) {
      console.error('Error getting seeker applications:', error);
      throw error;
    }
  },

  // Get applications for a job (for employers)
  getJobApplications: async (jobId: string): Promise<JobApplication[]> => {
    try {
      const q = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('jobId', '==', jobId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobApplication));
    } catch (error) {
      console.error('Error getting job applications:', error);
      throw error;
    }
  },

  // Update application status
  updateApplicationStatus: async (applicationId: string, status: JobApplication['status']): Promise<void> => {
    try {
      const appRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
      await updateDoc(appRef, {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }
};
