import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import MovieCard from '@/components/MovieCard';
import { StyledText } from '@/components/themed-text';
import { StyledView } from '@/components/themed-view';
import { getPopularMovies, Movie } from '@/services/movieService';
import { Colors } from '@/constants/theme';
import Animated from 'react-native-reanimated';

export default function MoviesScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPopularMovies();
        setMovies(response);
      } catch (err) {
        setError('Failed to fetch movies');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const renderItem = ({ item }: { item: Movie }) => (
    <View style={styles.movieCardContainer}>
      <MovieCard movie={item} translateX={new Animated.Value(0) as any} />
    </View>
  );

  return (
    <StyledView style={styles.container}>
      <StyledView style={styles.header}>
        <StyledText type="title">Popular Movies</StyledText>
      </StyledView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <StyledText>{error}</StyledText>
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={renderItem}
          keyExtractor={(item) => item.imdbID}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    backgroundColor: Colors.dark.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  movieCardContainer: {
    width: '48%',
    marginBottom: 20,
    height: 300,
  },
});
