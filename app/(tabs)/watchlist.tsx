import { StyledText } from '@/components/themed-text';
import { StyledView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, View, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { getWatchlist, removeFromWatchlist } from '@/services/watchlistService';
import { getMovieDetails, Movie } from '@/services/movieService';
import { router, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function WatchlistScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchWatchlist = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      setWatchlistMovies([]);
      return;
    }

    setLoading(true);
    try {
      const movieIds = await getWatchlist(currentUser.uid);
      const moviePromises = movieIds.map((id: string) => getMovieDetails(id));
      const movies = await Promise.all(moviePromises);
      // Filter out any potential nulls if a movie detail fetch fails
      setWatchlistMovies(movies.filter((m): m is Movie => m !== null));
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Refetch watchlist every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchWatchlist();
    }, [fetchWatchlist])
  );

  const handleRemoveFromWatchlist = async (movieId: string) => {
    if (!currentUser) return;
    await removeFromWatchlist(currentUser.uid, movieId);
    setWatchlistMovies(prev => prev.filter(movie => movie.imdbID !== movieId));
  };

  const renderItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity onPress={() => router.push(`/movie/${item.imdbID}`)} style={styles.itemContainer}>
      <Image source={{ uri: item.Poster }} style={styles.poster} />
      <View style={styles.infoContainer}>
        <StyledText type="body" style={styles.itemTitle}>{item.Title}</StyledText>
        <StyledText type="body">{item.Year} &middot; {item.imdbRating} ★</StyledText>
      </View>
      <TouchableOpacity onPress={() => handleRemoveFromWatchlist(item.imdbID)} style={styles.removeButton}>
        <IconSymbol name="trash" size={20} color={Colors.dark.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={Colors.dark.text} style={styles.centered} />;
    }

    if (!currentUser) {
      return (
        <View style={styles.centered}>
          <StyledText>Please log in to see your watchlist.</StyledText>
          <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginButton}>
            <StyledText type="button">Log In</StyledText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={watchlistMovies}
        renderItem={renderItem}
        keyExtractor={(item) => item.imdbID}
        ListEmptyComponent={<StyledText style={styles.emptyText}>Your watchlist is empty.</StyledText>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    );
  }

  return (
    <StyledView style={styles.container}>
      <StyledText type="title" style={styles.title}>Watchlist</StyledText>
      {renderContent()}
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: Colors.dark.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 20,
    color: 'white',
  },
  itemContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 4,
    backgroundColor: Colors.dark.card,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  removeButton: {
    padding: 10,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 25,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    opacity: 0.7,
  },
});