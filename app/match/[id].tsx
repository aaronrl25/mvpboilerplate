import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { StyledText } from '@/components/themed-text';
import { StyledView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

// TODO: Replace with actual data from Firestore
const placeholderMatch = {
  matchId: '123',
  compatibility: 75,
  sharedMovies: [
    { id: '1', title: 'Shared Movie 1' },
    { id: '2', title: 'Shared Movie 2' },
    { id: '3', title: 'Shared Movie 3' },
  ],
};

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();

  const renderMovieItem = ({ item }: { item: { title: string } }) => (
    <View style={styles.movieItem}>
      <StyledText>{item.title}</StyledText>
    </View>
  );

  return (
    <StyledView style={styles.container}>
      <StyledText type="title" style={styles.compatibilityText}>
        {placeholderMatch.compatibility}% Match
      </StyledText>
      <StyledText type="body" style={styles.sharedMoviesTitle}>Shared Movies</StyledText>
      <FlatList
        data={placeholderMatch.sharedMovies}
        renderItem={renderMovieItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<StyledText style={styles.emptyText}>No shared movies yet.</StyledText>}
      />
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: 20,
  },
  compatibilityText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: Colors.dark.tint,
  },
  sharedMoviesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  movieItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.card,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
});
