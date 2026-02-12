import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { MovieCard } from '@/components/MovieCard';
import { SearchBar } from '@/components/SearchBar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSelector } from '@/hooks/useRedux';
import { Movie, searchMovies } from '@/services/api';

export default function MoviesScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAppSelector((state) => state.auth);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      setSearchQuery(query);
      setError(null);
      const response = await searchMovies(query);
      
      if (response.Response === 'False') {
        setError(response.Error || 'No movies found');
        setMovies([]);
      } else {
        setMovies(response.Search);
      }
    } catch (err) {
      setError('Failed to search movies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Movie }) => <MovieCard movie={item} />;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Movies</ThemedText>
      </ThemedView>
      
      <SearchBar onSearch={handleSearch} />
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ThemedText>{error}</ThemedText>
        </View>
      ) : movies.length === 0 && searchQuery ? (
        <View style={styles.centerContainer}>
          <ThemedText>No movies found for "{searchQuery}"</ThemedText>
        </View>
      ) : movies.length === 0 ? (
        <View style={styles.centerContainer}>
          <ThemedText>Search for movies to get started</ThemedText>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
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
});
