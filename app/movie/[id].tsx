import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';

import { StyledText } from '@/components/themed-text';
import { StyledView } from '@/components/themed-view';
import { getMovieDetails, Movie } from '@/services/movieService';
import { Colors } from '@/constants/theme';

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const data = await getMovieDetails(id);
        setMovie(data);
      } catch (err) {
        setError('Failed to load movie details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  if (loading) {
    return (
      <StyledView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.tint} />
      </StyledView>
    );
  }

  if (error || !movie) {
    return (
      <StyledView style={styles.container}>
        <StyledText>{error || 'Movie not found'}</StyledText>
      </StyledView>
    );
  }
  
  return (
    <ScrollView style={styles.scrollView}>
      <Stack.Screen options={{ title: movie.Title }} />
      <StyledView style={styles.container}>
        {movie.Poster && movie.Poster !== 'N/A' ? (
          <Image source={{ uri: movie.Poster }} style={styles.poster} resizeMode="cover" />
        ) : (
          <StyledView style={styles.noPoster}>
            <StyledText>No Poster Available</StyledText>
          </StyledView>
        )}

        <View style={styles.detailsContainer}>
          <StyledText type="title" style={styles.title}>
            {movie.Title} ({movie.Year})
          </StyledText>

          <View style={styles.ratingContainer}>
            <StyledText type="body">IMDb Rating: </StyledText>
            <StyledText>{movie.imdbRating}/10</StyledText>
          </View>

          <View style={styles.section}>
            <StyledText type="caption" style={styles.sectionTitle}>Plot</StyledText>
            <StyledText style={styles.plot}>{movie.Plot}</StyledText>
          </View>

        </View>
      </StyledView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  poster: {
    width: '100%',
    height: 450,
    borderRadius: 8,
    marginBottom: 16,
  },
  noPoster: {
    width: '100%',
    height: 450,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    color: Colors.dark.text,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  plot: {
    lineHeight: 22,
    color: Colors.dark.text,
  },
});
