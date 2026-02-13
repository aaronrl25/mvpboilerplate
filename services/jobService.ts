import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  startAfter,
  doc, 
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

export interface Job {
  id?: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  type: JobType;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  tags: string[];
  applyUrl?: string;
  logoUrl?: string;
  postedAt: Timestamp;
  createdAt: Timestamp;
  employerId?: string;
  latitude?: number;
  longitude?: number;
  viewsCount?: number;
}

export interface SavedJob {
  jobId: string;
  savedAt: Timestamp;
}

const JOBS_COLLECTION = 'jobs';
const USERS_COLLECTION = 'users';

export const jobService = {
  getJobs: async (
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    pageSize: number = 10,
    filters?: {
      location?: string;
      remote?: boolean;
      type?: JobType;
      tags?: string[];
    }
  ): Promise<{ jobs: Job[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
    try {
      const jobsRef = collection(db, JOBS_COLLECTION);
      let constraints: any[] = [orderBy('postedAt', 'desc'), limit(pageSize)];

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      if (filters) {
        if (filters.remote !== undefined) {
          constraints.push(where('remote', '==', filters.remote));
        }
        if (filters.type) {
          constraints.push(where('type', '==', filters.type));
        }
        if (filters.location) {
          constraints.push(where('location', '==', filters.location));
        }
        if (filters.tags && filters.tags.length > 0) {
          constraints.push(where('tags', 'array-contains-any', filters.tags));
        }
      }

      const q = query(jobsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

      return { jobs, lastVisible };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },
  
  createJob: async (jobData: Omit<Job, 'id' | 'postedAt' | 'createdAt'>): Promise<string> => {
    try {
      const jobsRef = collection(db, JOBS_COLLECTION);
      const now = Timestamp.now();
      const newJob = {
        ...jobData,
        postedAt: now,
        createdAt: now,
      };
      const docRef = await addDoc(jobsRef, newJob);
      return docRef.id;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  getJobById: async (id: string): Promise<Job | undefined> => {
    try {
      const docRef = doc(db, JOBS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Job;
      }
      return undefined;
    } catch (error) {
      console.error('Error fetching job by id:', error);
      throw error;
    }
  },

  deleteJob: async (jobId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, JOBS_COLLECTION, jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  incrementViewsCount: async (jobId: string): Promise<void> => {
    try {
      const jobRef = doc(db, JOBS_COLLECTION, jobId);
      const jobSnap = await getDoc(jobRef);
      if (jobSnap.exists()) {
        const currentViews = jobSnap.data().viewsCount || 0;
        await setDoc(jobRef, { viewsCount: currentViews + 1 }, { merge: true });
      }
    } catch (error) {
      console.error('Error incrementing views count:', error);
    }
  },

  getRelatedJobs: async (jobId: string, tags: string[], limitCount: number = 3): Promise<Job[]> => {
    try {
      if (!tags || tags.length === 0) return [];
      
      const jobsRef = collection(db, JOBS_COLLECTION);
      const q = query(
        jobsRef,
        where('tags', 'array-contains-any', tags),
        limit(limitCount + 1)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Job))
        .filter(job => job.id !== jobId)
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching related jobs:', error);
      return [];
    }
  },

  // Saved Jobs logic
  saveJob: async (userId: string, jobId: string): Promise<void> => {
    try {
      const savedJobRef = doc(db, USERS_COLLECTION, userId, 'savedJobs', jobId);
      await setDoc(savedJobRef, {
        jobId,
        savedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving job:', error);
      throw error;
    }
  },

  unsaveJob: async (userId: string, jobId: string): Promise<void> => {
    try {
      const savedJobRef = doc(db, USERS_COLLECTION, userId, 'savedJobs', jobId);
      await deleteDoc(savedJobRef);
    } catch (error) {
      console.error('Error unsaving job:', error);
      throw error;
    }
  },

  getSavedJobs: async (userId: string): Promise<Job[]> => {
    try {
      const savedJobsRef = collection(db, USERS_COLLECTION, userId, 'savedJobs');
      const querySnapshot = await getDocs(savedJobsRef);
      
      const savedJobIds = querySnapshot.docs.map(doc => doc.data().jobId);
      
      if (savedJobIds.length === 0) return [];

      const jobsRef = collection(db, JOBS_COLLECTION);
      const allJobs: Job[] = [];
      
      // Firestore 'in' query is limited to 30 IDs in recent versions, but chunking is safer
      const CHUNK_SIZE = 10;
      for (let i = 0; i < savedJobIds.length; i += CHUNK_SIZE) {
        const chunk = savedJobIds.slice(i, i + CHUNK_SIZE);
        const q = query(jobsRef, where('__name__', 'in', chunk));
        const jobsSnapshot = await getDocs(q);
        
        const chunkJobs = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[];
        
        allJobs.push(...chunkJobs);
      }
      
      // Sort by original savedAt order if needed, or just return
      return allJobs;
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      throw error;
    }
  },

  isJobSaved: async (userId: string, jobId: string): Promise<boolean> => {
    try {
      const savedJobRef = doc(db, USERS_COLLECTION, userId, 'savedJobs', jobId);
      const docSnap = await getDoc(savedJobRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking if job is saved:', error);
      return false;
    }
  },

  // Saved Searches
  saveSearch: async (userId: string, searchData: {
    query: string;
    filters: {
      location?: string;
      remote?: boolean;
      type?: JobType;
      tags?: string[];
    }
  }): Promise<void> => {
    try {
      const savedSearchesRef = collection(db, USERS_COLLECTION, userId, 'savedSearches');
      await addDoc(savedSearchesRef, {
        ...searchData,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  },

  getSavedSearches: async (userId: string): Promise<any[]> => {
    try {
      const savedSearchesRef = collection(db, USERS_COLLECTION, userId, 'savedSearches');
      const q = query(savedSearchesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      throw error;
    }
  },

  deleteSavedSearch: async (userId: string, searchId: string): Promise<void> => {
    try {
      const searchRef = doc(db, USERS_COLLECTION, userId, 'savedSearches', searchId);
      await deleteDoc(searchRef);
    } catch (error) {
      console.error('Error deleting saved search:', error);
      throw error;
    }
  },

  getJobsByEmployer: async (employerId: string): Promise<Job[]> => {
    try {
      const jobsRef = collection(db, JOBS_COLLECTION);
      const q = query(
        jobsRef,
        where('employerId', '==', employerId),
        orderBy('postedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
    } catch (error) {
      console.error('Error fetching jobs by employer:', error);
      throw error;
    }
  },

  getSuggestedJobs: async (latitude: number, longitude: number, maxDistanceKm: number = 50): Promise<Job[]> => {
    try {
      const jobsRef = collection(db, JOBS_COLLECTION);
      // In a real production app with many jobs, we would use GeoFirestore or similar
      // For this MVP, we'll fetch recent jobs and filter by distance in memory
      const q = query(
        jobsRef,
        orderBy('postedAt', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];

      // Helper to calculate distance (using the same logic as locationService but inline to avoid circular dep if any)
      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      return jobs
        .filter(job => {
          if (job.latitude && job.longitude) {
            const distance = getDistance(latitude, longitude, job.latitude, job.longitude);
            return distance <= maxDistanceKm;
          }
          return false;
        })
        .sort((a, b) => {
          const distA = getDistance(latitude, longitude, a.latitude!, a.longitude!);
          const distB = getDistance(latitude, longitude, b.latitude!, b.longitude!);
          return distA - distB;
        });
    } catch (error) {
      console.error('Error fetching suggested jobs:', error);
      throw error;
    }
  }
};
