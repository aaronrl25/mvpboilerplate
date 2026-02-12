export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string; // Full-time, Part-time, Contract
  postedAt: string;
  logo: string;
  description: string;
}

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'TechCorp',
    location: 'Remote',
    salary: '$140k - $180k',
    type: 'Full-time',
    postedAt: '2 days ago',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=TC',
    description: 'We are looking for a Senior Frontend Engineer to lead our React team...',
  },
  {
    id: '2',
    title: 'Product Designer',
    company: 'Creative Studio',
    location: 'New York, NY',
    salary: '$110k - $150k',
    type: 'Full-time',
    postedAt: '1 day ago',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=CS',
    description: 'Join our design team to create beautiful user experiences...',
  },
  {
    id: '3',
    title: 'Backend Developer',
    company: 'DataFlow',
    location: 'Austin, TX',
    salary: '$120k - $160k',
    type: 'Contract',
    postedAt: '3 days ago',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=DF',
    description: 'Work on our core infrastructure using Node.js and PostgreSQL...',
  },
  {
    id: '4',
    title: 'Mobile App Developer',
    company: 'Appify',
    location: 'Remote',
    salary: '$130k - $170k',
    type: 'Full-time',
    postedAt: '5 hours ago',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=AP',
    description: 'Help us build the next generation of mobile applications with React Native...',
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'CloudScale',
    location: 'Seattle, WA',
    salary: '$150k - $200k',
    type: 'Full-time',
    postedAt: '1 week ago',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=CL',
    description: 'Scale our infrastructure to handle millions of requests...',
  },
];

export const jobService = {
  getJobs: async (): Promise<Job[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return MOCK_JOBS;
  },
  searchJobs: async (query: string): Promise<Job[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    const lowercaseQuery = query.toLowerCase();
    return MOCK_JOBS.filter(
      (job) =>
        job.title.toLowerCase().includes(lowercaseQuery) ||
        job.company.toLowerCase().includes(lowercaseQuery) ||
        job.location.toLowerCase().includes(lowercaseQuery)
    );
  },
  getJobById: async (id: string): Promise<Job | undefined> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_JOBS.find((job) => job.id === id);
  },
};
