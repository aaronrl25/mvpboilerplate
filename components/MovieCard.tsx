import { router } from 'expo-router';
import React from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity } from 'react-native';

import { Movie } from '@/services/api';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface MovieCardProps {
  movie: Movie;
}

const { width } = Dimensions.get('window');
const cardWidth = width / 2 - 24; // 2 columns with padding

export function MovieCard({ movie }: MovieCardProps) {
  const handlePress = () => {
    router.push(`/movie/${movie.imdbID}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      {movie.Poster && movie.Poster !== 'N/A' ? (
        <Image source={{ uri: movie.Poster }} style={styles.poster} resizeMode="cover" />
      ) : (
        <ThemedView style={styles.noPoster}>
          <ThemedText>No Poster</ThemedText>
        </ThemedView>
      )}
      <ThemedView style={styles.infoContainer}>
        <ThemedText numberOfLines={1} style={styles.title}>
          {movie.Title}
        </ThemedText>
        <ThemedText style={styles.year}>{movie.Year}</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  poster: {
    width: '100%',
    height: cardWidth * 1.5, // 3:2 aspect ratio
  },
  noPoster: {
    width: '100%',
    height: cardWidth * 1.5,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  year: {
    fontSize: 12,
    color: '#666',
  },
});