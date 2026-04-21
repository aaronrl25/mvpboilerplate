import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { getPopularMovies, Movie } from '@/services/movieService';
import { StyledView } from '@/components/themed-view';
import { AnimatedCard } from '@/components/AnimatedCard';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { addToWatchlist } from '@/services/watchlistService';

export default function SwipeScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      const popularMovies = await getPopularMovies();
      setMovies(popularMovies.reverse()); // Reverse to pop from the end
      setLoading(false);
    };

    fetchMovies();
  }, []);

  const onSwipe = (direction: 'left' | 'right' | 'up', movieId: string) => {
    if (currentUser && (direction === 'right' || direction === 'up')) {
      addToWatchlist(currentUser.uid, movieId);
    }
    setMovies((prevMovies) => prevMovies.slice(0, prevMovies.length - 1));
  };

  if (loading) {
    return <ActivityIndicator style={styles.centered} />;
  }

  return (
    <StyledView style={styles.container}>
      <View style={styles.stack}>
        {movies.map((movie, index) => {
            return (
              <AnimatedCard
                            key={movie.imdbID}
                            movie={movie}
                            onSwipe={(direction) => onSwipe(direction, movie.imdbID)}
                            isTop={index === movies.length - 1}
                          />
            );
          })
        }
      </View>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stack: {
    width: '90%',
    height: '80%',
  },
});
