import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMovieDetails, MovieDetails } from '@/services/api';

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
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
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </ThemedView>
    );
  }

  if (error || !movie) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>{error || 'Movie not found'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      <Stack.Screen options={{ title: movie.Title }} />
      <ThemedView style={styles.container}>
        {movie.Poster && movie.Poster !== 'N/A' ? (
          <Image source={{ uri: movie.Poster }} style={styles.poster} resizeMode="cover" />
        ) : (
          <ThemedView style={styles.noPoster}>
            <ThemedText>No Poster Available</ThemedText>
          </ThemedView>
        )}

        <ThemedView style={styles.detailsContainer}>
          <ThemedText type="title" style={styles.title}>
            {movie.Title} ({movie.Year})
          </ThemedText>

          <ThemedView style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">{movie.Rated}</ThemedText>
            <ThemedText> • </ThemedText>
            <ThemedText>{movie.Runtime}</ThemedText>
            <ThemedText> • </ThemedText>
            <ThemedText>{movie.Genre}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.ratingContainer}>
            <ThemedText type="defaultSemiBold">IMDb Rating: </ThemedText>
            <ThemedText>{movie.imdbRating}/10</ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Plot</ThemedText>
            <ThemedText style={styles.plot}>{movie.Plot}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Cast</ThemedText>
            <ThemedText>{movie.Actors}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Director</ThemedText>
            <ThemedText>{movie.Director}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Writer</ThemedText>
            <ThemedText>{movie.Writer}</ThemedText>
          </ThemedView>

          {movie.Awards !== 'N/A' && (
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Awards</ThemedText>
              <ThemedText>{movie.Awards}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
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
  plot: {
    lineHeight: 22,
  },
});