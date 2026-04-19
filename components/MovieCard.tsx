import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { StyledText } from './themed-text';
import { Movie } from '@/services/movieService';
import { IconSymbol } from './ui/icon-symbol';
import { Colors } from '@/constants/theme';

interface MovieCardProps {
  movie: Movie;
  translateX: SharedValue<number>;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, translateX }) => {

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 100], [0, 1]),
  }));

  const dislikeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -100], [0, 1]),
  }));

  return (
    <View style={styles.card}>
      <Image source={{ uri: movie.Poster }} style={styles.poster} />
      <View style={styles.overlay}>
        <StyledText type="title" style={styles.title}>
          {movie.Title}
        </StyledText>
      </View>
      <Animated.View style={[styles.indicator, styles.like, likeStyle]}>
        <IconSymbol name="heart.fill" size={40} color={Colors.dark.tint} />
      </Animated.View>
      <Animated.View style={[styles.indicator, styles.dislike, dislikeStyle]}>
        <IconSymbol name="xmark" size={40} color={'#ff4a4a'} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '100%',
    height: '100%',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 24,
  },
  indicator: {
    position: 'absolute',
    top: 40,
    borderRadius: 20,
    padding: 10,
  },
  like: {
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  dislike: {
    right: 20,
    transform: [{ rotate: '15deg' }],
  },
});

export default MovieCard;
