import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Job, jobService } from './jobService';
import { applicationService, JobApplication } from './applicationService';

export interface EmployerStats {
  totalJobs: number;
  totalViews: number;
  totalApplications: number;
  activeJobs: number;
  applicationStats: {
    pending: number;
    reviewed: number;
    accepted: number;
    rejected: number;
  };
  jobsStats: Array<{
    jobId: string;
    title: string;
    views: number;
    applications: number;
  }>;
}

export const employerService = {
  getEmployerStats: async (employerId: string): Promise<EmployerStats> => {
    try {
      // 1. Get all jobs by employer
      const jobs = await jobService.getJobsByEmployer(employerId);
      
      // 2. Get all applications for these jobs
      const applicationsRef = collection(db, 'applications');
      const stats: EmployerStats = {
        totalJobs: jobs.length,
        totalViews: 0,
        totalApplications: 0,
        activeJobs: 0,
        applicationStats: {
          pending: 0,
          reviewed: 0,
          accepted: 0,
          rejected: 0
        },
        jobsStats: []
      };

      for (const job of jobs) {
        stats.totalViews += (job.viewsCount || 0);
        if (job.status === 'active') stats.activeJobs++;

        const q = query(applicationsRef, where('jobId', '==', job.id));
        const appSnapshot = await getDocs(q);
        const appCount = appSnapshot.size;
        
        stats.totalApplications += appCount;
        
        appSnapshot.docs.forEach(doc => {
          const app = doc.data() as JobApplication;
          if (app.status === 'pending') stats.applicationStats.pending++;
          else if (app.status === 'reviewed') stats.applicationStats.reviewed++;
          else if (app.status === 'accepted') stats.applicationStats.accepted++;
          else if (app.status === 'rejected') stats.applicationStats.rejected++;
        });

        stats.jobsStats.push({
          jobId: job.id!,
          title: job.title,
          views: job.viewsCount || 0,
          applications: appCount
        });
      }

      return stats;
    } catch (error) {
      console.error('Error fetching employer stats:', error);
      throw error;
    }
  }
};
