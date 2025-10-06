import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { MovieCard } from '@/components/MovieCard';
import { SearchBar } from '@/components/SearchBar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { Movie, searchMovies } from '@/services/api';
import { logout } from '@/store/authSlice';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user]);

  const handleSearch = async (query: string) => {
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

  const handleLogout = () => {
    dispatch(logout());
  };

  const renderItem = ({ item }: { item: Movie }) => <MovieCard movie={item} />;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Movies App</ThemedText>
        
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#2196F3',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});
