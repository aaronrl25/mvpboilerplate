import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Dimensions } from 'react-native';
import { StyledText } from '@/components/themed-text';
import { StyledView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { watchlistService } from '@/services/watchlistService';
import { getMovieDetails, Movie } from '@/services/movieService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 1;
const POSTER_WIDTH = (width - 40 - (NUM_COLUMNS - 1) * 10) / NUM_COLUMNS;

export default function UserProfileScreen() {
  const { uid } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ displayName: string; email: string } | null>(null);
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);

  useEffect(() => {
    if (typeof uid !== 'string') return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch user basic info
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ 
            displayName: userData.displayName || userData.email?.split('@')[0] || 'User', 
            email: userData.email 
          });
        }

        // Fetch liked movies
        const movieIds = await watchlistService.getWatchlist(uid);
        const moviePromises = movieIds.map(id => getMovieDetails(id));
        const movies = await Promise.all(moviePromises);
        setLikedMovies(movies.filter(m => m) as Movie[]);

      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [uid]);

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity onPress={() => router.push(`/movie/${item.imdbID}`)} style={styles.movieItem}>
      <Image source={{ uri: item.Poster }} style={styles.poster} />
      <View style={styles.infoContainer}>
        <StyledText type="body" style={styles.itemTitle}>{item.Title}</StyledText>
        <StyledText type="caption">{item.Year} &middot; {item.imdbRating} ★</StyledText>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.dark.text} style={styles.centered} />;
  }

  if (!user) {
    return (
      <StyledView style={styles.centered}>
        <StyledText>User not found.</StyledText>
      </StyledView>
    );
  }

  return (
    <StyledView style={styles.container}>
        <FlatList
            data={likedMovies}
            renderItem={renderMovieItem}
            keyExtractor={(item) => item.imdbID}
            numColumns={NUM_COLUMNS}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
                <View style={styles.header}>
                    <StyledText type="title" style={styles.userName}>{user.displayName}</StyledText>
                    <StyledText style={styles.userEmail}>{user.email}</StyledText>
                    <StyledText type="body" style={styles.likedMoviesTitle}>Liked Movies</StyledText>
                </View>
            )}
            ListEmptyComponent={() => (
                <StyledView style={styles.centered}>
                     <StyledText style={styles.emptyText}>No liked movies yet.</StyledText>
                </StyledView>
            )}
            contentContainerStyle={{ flexGrow: 1 }}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 30,
  },
  likedMoviesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  movieItem: {
    width: POSTER_WIDTH,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
});