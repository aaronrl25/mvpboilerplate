import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAppSelector } from '@/hooks/useRedux';
import { db } from '@/services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: string;
  appliedAt: any;
}

export default function MyApplicationsScreen() {
  const colorScheme = 'light'; // Assuming light mode for now, can be dynamic
  const user = useAppSelector((state) => state.auth.user);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const fetchApplications = async () => {
      try {
        const q = query(
          collection(db, 'applications'),
          where('applicantId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedApplications: Application[] = [];
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          // Fetch job details for jobTitle and companyName
          const jobDoc = await getDocs(query(collection(db, 'jobs'), where('id', '==', data.jobId)));
          const jobData = jobDoc.docs[0]?.data();

          fetchedApplications.push({
            id: doc.id,
            jobId: data.jobId,
            jobTitle: jobData?.title || 'Unknown Job',
            companyName: jobData?.companyName || 'Unknown Company',
            status: data.status,
            appliedAt: data.appliedAt?.toDate().toLocaleDateString(),
          });
        }
        setApplications(fetchedApplications);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user?.uid]);

  const renderApplicationItem = ({ item }: { item: Application }) => (
    <ThemedView style={styles.applicationCard}>
      <ThemedText type="subtitle">{item.jobTitle}</ThemedText>
      <ThemedText>{item.companyName}</ThemedText>
      <ThemedText>Status: {item.status}</ThemedText>
      <ThemedText>Applied: {item.appliedAt}</ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'My Applications' }} />
      <ThemedText type="title" style={styles.header}>My Applications</ThemedText>
      {
        loading ? (
          <ThemedText>Loading applications...</ThemedText>
        ) : applications.length === 0 ? (
          <ThemedText>No applications found.</ThemedText>
        ) : (
          <FlatList
            data={applications}
            renderItem={renderApplicationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )
      }
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.medium,
    backgroundColor: Colors.light.background,
  },
  header: {
    marginBottom: Spacing.large,
    color: Colors.light.text,
  },
  applicationCard: {
    backgroundColor: Colors.light.card,
    padding: Spacing.medium,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.medium,
    ...Shadows.shadowLight,
  },
  listContent: {
    paddingBottom: Spacing.large,
  }
});
